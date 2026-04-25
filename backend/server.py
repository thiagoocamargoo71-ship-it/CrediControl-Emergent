from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Any, Dict, List

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from pydantic import BaseModel, EmailStr
from starlette.middleware.cors import CORSMiddleware
from supabase._async.client import create_client as create_async_client, AsyncClient


# =========================
# ENV / PATHS / LOGGING
# =========================

ROOT_DIR = Path(__file__).parent
load_dotenv()
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# =========================
# APP
# =========================

app = FastAPI(title="CrediControl API", version="2.0.1")


# =========================
# CONFIG
# =========================

JWT_ALGORITHM = "HS256"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Global async client (initialized on startup)
supabase: Optional[AsyncClient] = None


# =========================
# HELPERS
# =========================

def get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET não configurado")
    return secret


def is_production() -> bool:
    return FRONTEND_URL.startswith("https://")


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    secure = is_production()
    samesite = "none" if secure else "lax"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=3600,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=604800,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    secure = is_production()
    samesite = "none" if secure else "lax"

    response.delete_cookie("access_token", path="/", secure=secure, samesite=samesite)
    response.delete_cookie("refresh_token", path="/", secure=secure, samesite=samesite)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def ensure_supabase() -> AsyncClient:
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="Serviço de banco ainda não inicializado"
        )
    return supabase


def parse_due_date(value: str):
    return datetime.strptime(value, "%Y-%m-%d").date()


def parse_iso_datetime(value: str) -> datetime:
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value


# =========================
# SUPABASE HELPERS
# =========================

async def sb_one(table: str, cols: str = "*", eq: Dict[str, Any] = None, neq: Dict[str, Any] = None):
    db = ensure_supabase()
    q = db.table(table).select(cols)

    if eq:
        for k, v in eq.items():
            q = q.eq(k, v)
    if neq:
        for k, v in neq.items():
            q = q.neq(k, v)

    r = await q.limit(1).execute()
    return r.data[0] if r.data else None


async def sb_many(
    table: str,
    cols: str = "*",
    eq: Dict[str, Any] = None,
    neq: Dict[str, Any] = None,
    in_: Dict[str, List[Any]] = None,
    order: Optional[str] = None,
):
    db = ensure_supabase()
    q = db.table(table).select(cols)

    if eq:
        for k, v in eq.items():
            q = q.eq(k, v)
    if neq:
        for k, v in neq.items():
            q = q.neq(k, v)
    if in_:
        for k, v in in_.items():
            q = q.in_(k, v)
    if order:
        q = q.order(order)

    r = await q.execute()
    return r.data


async def sb_count(table: str, eq: Dict[str, Any] = None) -> int:
    db = ensure_supabase()
    q = db.table(table).select("id", count="exact")

    if eq:
        for k, v in eq.items():
            q = q.eq(k, v)

    r = await q.execute()
    return r.count or 0


async def sb_insert(table: str, doc: Any):
    db = ensure_supabase()
    r = await db.table(table).insert(doc).execute()
    return r.data


async def sb_update(table: str, data: Dict[str, Any], eq: Dict[str, Any] = None):
    db = ensure_supabase()
    q = db.table(table).update(data)

    if eq:
        for k, v in eq.items():
            q = q.eq(k, v)

    r = await q.execute()
    return r.data


async def sb_delete(table: str, eq: Dict[str, Any] = None):
    db = ensure_supabase()
    q = db.table(table).delete()

    if eq:
        for k, v in eq.items():
            q = q.eq(k, v)

    await q.execute()


# =========================
# AUTH DEPENDENCIES
# =========================

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")

    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")

    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Tipo de token inválido")

        user = await sb_one(
            "users",
            "id, name, email, role, is_blocked, created_at",
            eq={"id": payload["sub"]}
        )

        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")

        if user.get("is_blocked", False):
            raise HTTPException(status_code=403, detail="Usuário bloqueado")

        return {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user.get("created_at"),
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Acesso negado. Apenas administradores."
        )
    return user


async def require_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user["role"] != "user":
        raise HTTPException(
            status_code=403,
            detail="Acesso negado. Apenas usuários."
        )
    return user


# =========================
# ROUTERS
# =========================

api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Auth"])
customers_router = APIRouter(prefix="/customers", tags=["Customers"])
loans_router = APIRouter(prefix="/loans", tags=["Loans"])
installments_router = APIRouter(prefix="/installments", tags=["Installments"])
payments_router = APIRouter(prefix="/payments", tags=["Payments"])
dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
settings_router = APIRouter(prefix="/settings", tags=["Settings"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])


# =========================
# MODELS
# =========================

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    document: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_referral: bool = False
    referral_name: Optional[str] = None
    referral_phone: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    document: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_referral: Optional[bool] = None
    referral_name: Optional[str] = None
    referral_phone: Optional[str] = None


class LoanCreate(BaseModel):
    customer_id: str
    amount: float
    interest_rate: float
    number_of_installments: int
    start_date: str
    interval_days: int


class UserSettingsUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserPreferencesUpdate(BaseModel):
    default_interest_rate: Optional[float] = None
    default_interval_days: Optional[int] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class AdminCreateUser(BaseModel):
    name: str
    email: EmailStr
    password: str


class AdminUpdateUser(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class SimulateLoanRequest(BaseModel):
    amount: float
    rate: float
    installments: int


# =========================
# AUTH ROUTES
# =========================

@auth_router.post("/register")
async def register(data: UserRegister, response: Response):
    email = data.email.lower()

    if await sb_one("users", "id", eq={"email": email}):
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    hashed = hash_password(data.password)

    rows = await sb_insert("users", {
        "name": data.name,
        "email": email,
        "password_hash": hashed,
        "role": "user",
        "is_blocked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    user_id = rows[0]["id"]
    set_auth_cookies(
        response,
        create_access_token(user_id, email, "user"),
        create_refresh_token(user_id),
    )

    return {
        "id": user_id,
        "name": data.name,
        "email": email,
        "role": "user",
    }


@auth_router.post("/login")
async def login(data: UserLogin, response: Response, request: Request):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    attempts = await sb_one("login_attempts", "*", eq={"identifier": identifier})

    if attempts and attempts.get("count", 0) >= 5:
        lockout_until = attempts.get("lockout_until")
        if lockout_until:
            lockout_dt = parse_iso_datetime(lockout_until)
            if datetime.now(timezone.utc) < lockout_dt:
                raise HTTPException(
                    status_code=429,
                    detail="Muitas tentativas. Tente novamente em 15 minutos."
                )

        await sb_delete("login_attempts", eq={"identifier": identifier})
        attempts = None

    user = await sb_one("users", "*", eq={"email": email})

    if not user or not verify_password(data.password, user["password_hash"]):
        lockout_time = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()

        if attempts:
            await sb_update(
                "login_attempts",
                {"count": attempts["count"] + 1, "lockout_until": lockout_time},
                eq={"identifier": identifier}
            )
        else:
            await sb_insert("login_attempts", {
                "identifier": identifier,
                "count": 1,
                "lockout_until": lockout_time
            })

        raise HTTPException(status_code=401, detail="Email ou senha inválidos")

    if user.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="Usuário bloqueado")

    if attempts:
        await sb_delete("login_attempts", eq={"identifier": identifier})

    user_id = user["id"]
    set_auth_cookies(
        response,
        create_access_token(user_id, email, user["role"]),
        create_refresh_token(user_id),
    )

    return {
        "id": user_id,
        "name": user["name"],
        "email": email,
        "role": user["role"],
    }


@auth_router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user


@auth_router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logout realizado com sucesso"}


@auth_router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Token de refresh não encontrado")

    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Tipo de token inválido")

        user = await sb_one("users", "id, email, role", eq={"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")

        access_token = create_access_token(user["id"], user["email"], user["role"])

        secure = is_production()
        samesite = "none" if secure else "lax"

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=secure,
            samesite=samesite,
            max_age=3600,
            path="/",
        )

        return {"message": "Token renovado"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


# =========================
# CUSTOMERS ROUTES
# =========================

@customers_router.get("")
async def list_customers(user: dict = Depends(require_user)):
    return await sb_many("customers", "*", eq={"user_id": user["id"]})


@customers_router.post("")
async def create_customer(data: CustomerCreate, user: dict = Depends(require_user)):
    rows = await sb_insert("customers", {
        "user_id": user["id"],
        "name": data.name,
        "phone": data.phone,
        "email": data.email,
        "document": data.document,
        "address": data.address,
        "notes": data.notes,
        "is_referral": data.is_referral,
        "referral_name": data.referral_name if data.is_referral else None,
        "referral_phone": data.referral_phone if data.is_referral else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return rows[0]


@customers_router.get("/{customer_id}")
async def get_customer(customer_id: str, user: dict = Depends(require_user)):
    customer = await sb_one(
        "customers",
        "*",
        eq={"id": customer_id, "user_id": user["id"]}
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return customer


@customers_router.get("/{customer_id}/status")
async def get_customer_status(customer_id: str, user: dict = Depends(require_user)):
    if not await sb_one("customers", "id", eq={"id": customer_id, "user_id": user["id"]}):
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    loans = await sb_many("loans", "id", eq={"customer_id": customer_id})
    if not loans:
        return {
            "status": "no_loans",
            "label": "Sem Empréstimo",
            "total_loans": 0,
            "total_pending": 0,
            "total_overdue": 0,
        }

    loan_ids = [l["id"] for l in loans]
    unpaid = await sb_many(
        "installments",
        "due_date, status",
        in_={"loan_id": loan_ids},
        neq={"status": "paid"}
    )

    today = datetime.now(timezone.utc).date()
    total_pending = 0
    total_overdue = 0

    for inst in unpaid:
        if parse_due_date(inst["due_date"]) < today:
            total_overdue += 1
        else:
            total_pending += 1

    if total_overdue > 0:
        return {
            "status": "overdue",
            "label": "Atrasado",
            "total_loans": len(loans),
            "total_pending": total_pending,
            "total_overdue": total_overdue,
        }

    return {
        "status": "on_time",
        "label": "Em Dia",
        "total_loans": len(loans),
        "total_pending": total_pending,
        "total_overdue": 0,
    }


@customers_router.put("/{customer_id}")
async def update_customer(customer_id: str, data: CustomerUpdate, user: dict = Depends(require_user)):
    if not await sb_one("customers", "id", eq={"id": customer_id, "user_id": user["id"]}):
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    update_data = {}
    for k, v in data.model_dump().items():
        if v is not None:
            if k == "is_referral" and v is False:
                update_data.update({
                    "is_referral": False,
                    "referral_name": None,
                    "referral_phone": None,
                })
            else:
                update_data[k] = v

    if update_data:
        await sb_update("customers", update_data, eq={"id": customer_id})

    return await sb_one("customers", "*", eq={"id": customer_id})


@customers_router.delete("/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(require_user)):
    if not await sb_one("customers", "id", eq={"id": customer_id, "user_id": user["id"]}):
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    if await sb_one("loans", "id", eq={"customer_id": customer_id}):
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir cliente com empréstimos ativos"
        )

    await sb_delete("customers", eq={"id": customer_id})
    return {"message": "Cliente excluído com sucesso"}


# =========================
# LOANS ROUTES
# =========================

@loans_router.get("")
async def list_loans(user: dict = Depends(require_user)):
    loans = await sb_many("loans", "*", eq={"user_id": user["id"]})
    if not loans:
        return []

    customer_ids = list(set(l["customer_id"] for l in loans))
    customers = await sb_many("customers", "id, name", in_={"id": customer_ids})
    cust_map = {c["id"]: c["name"] for c in customers}

    for loan in loans:
        loan["customer_name"] = cust_map.get(loan["customer_id"], "N/A")

    return loans


@loans_router.post("")
async def create_loan(data: LoanCreate, user: dict = Depends(require_user)):
    customer = await sb_one(
        "customers",
        "id, name",
        eq={"id": data.customer_id, "user_id": user["id"]}
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    total_amount = data.amount + (data.amount * data.interest_rate / 100)
    installment_amount = total_amount / data.number_of_installments

    rows = await sb_insert("loans", {
        "user_id": user["id"],
        "customer_id": data.customer_id,
        "amount": data.amount,
        "interest_rate": data.interest_rate,
        "total_amount": round(total_amount, 2),
        "number_of_installments": data.number_of_installments,
        "start_date": data.start_date,
        "interval_days": data.interval_days,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    loan = rows[0]
    loan_id = loan["id"]

    start = parse_iso_datetime(data.start_date)
    installments = []

    for i in range(data.number_of_installments):
        due_date = start + timedelta(days=data.interval_days * (i + 1))
        installments.append({
            "loan_id": loan_id,
            "number": i + 1,
            "amount": round(installment_amount, 2),
            "updated_amount": round(installment_amount, 2),
            "due_date": due_date.strftime("%Y-%m-%d"),
            "status": "pending",
            "paid_at": None,
        })

    if installments:
        await sb_insert("installments", installments)

    loan["customer_name"] = customer["name"]
    return loan


@loans_router.get("/{loan_id}")
async def get_loan(loan_id: str, user: dict = Depends(require_user)):
    loan = await sb_one("loans", "*", eq={"id": loan_id, "user_id": user["id"]})
    if not loan:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")

    customer = await sb_one("customers", "name", eq={"id": loan["customer_id"]})
    loan["customer_name"] = customer["name"] if customer else "N/A"
    return loan


@loans_router.delete("/{loan_id}")
async def delete_loan(loan_id: str, user: dict = Depends(require_user)):
    if not await sb_one("loans", "id", eq={"id": loan_id, "user_id": user["id"]}):
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")

    await sb_delete("loans", eq={"id": loan_id})
    return {"message": "Empréstimo excluído com sucesso"}


# =========================
# INSTALLMENTS ROUTES
# =========================

@installments_router.get("/report/all")
async def list_all_installments_for_report(user: dict = Depends(require_user)):
    loans = await sb_many("loans", "*", eq={"user_id": user["id"]})
    if not loans:
        return []

    loan_ids = [loan["id"] for loan in loans]
    loan_map = {loan["id"]: loan for loan in loans}

    customer_ids = list(set(loan["customer_id"] for loan in loans))
    customers = await sb_many("customers", "id, name", in_={"id": customer_ids})
    customer_map = {customer["id"]: customer["name"] for customer in customers}

    insts = await sb_many("installments", "*", in_={"loan_id": loan_ids}, order="due_date")

    today = datetime.now(timezone.utc).date()
    result = []

    for inst in insts:
        loan = loan_map.get(inst["loan_id"])
        if not loan:
            continue

        due_date = parse_due_date(inst["due_date"])
        days_overdue = 0
        updated_amount = inst["amount"]
        status = inst["status"]

        if status == "pending" and due_date < today:
            days_overdue = (today - due_date).days
            daily_rate = (loan.get("interest_rate") or 0) / 30 / 100
            updated_amount = inst["amount"] + (inst["amount"] * daily_rate * days_overdue)
            status = "overdue"

            await sb_update(
                "installments",
                {
                    "status": "overdue",
                    "updated_amount": round(updated_amount, 2),
                },
                eq={"id": inst["id"]}
            )

        elif status == "overdue" and due_date < today:
            days_overdue = (today - due_date).days
            daily_rate = (loan.get("interest_rate") or 0) / 30 / 100
            updated_amount = inst["amount"] + (inst["amount"] * daily_rate * days_overdue)

            await sb_update(
                "installments",
                {"updated_amount": round(updated_amount, 2)},
                eq={"id": inst["id"]}
            )

        result.append({
            "id": inst["id"],
            "loan_id": inst["loan_id"],
            "customer_id": loan["customer_id"],
            "customer_name": customer_map.get(loan["customer_id"], "N/A"),
            "number": inst["number"],
            "amount": inst["amount"],
            "updated_amount": round(updated_amount, 2),
            "due_date": inst["due_date"],
            "status": status,
            "paid_at": inst.get("paid_at"),
            "days_overdue": days_overdue,
            "interest_rate": loan.get("interest_rate", 0),
            "loan_amount": loan.get("amount", 0),
            "loan_total": loan.get("total_amount", 0),
        })

    return result


@installments_router.get("/loan/{loan_id}")
async def list_installments(loan_id: str, user: dict = Depends(require_user)):
    loan = await sb_one("loans", "id, interest_rate", eq={"id": loan_id, "user_id": user["id"]})
    if not loan:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")

    insts = await sb_many("installments", "*", eq={"loan_id": loan_id}, order="number")
    today = datetime.now(timezone.utc).date()
    result = []

    for inst in insts:
        due_date = parse_due_date(inst["due_date"])
        days_overdue = 0
        updated_amount = inst["amount"]
        status = inst["status"]

        if status == "pending" and due_date < today:
            days_overdue = (today - due_date).days
            daily_rate = (loan["interest_rate"] or 0) / 30 / 100
            updated_amount = inst["amount"] + (inst["amount"] * daily_rate * days_overdue)
            status = "overdue"

            await sb_update(
                "installments",
                {"status": "overdue", "updated_amount": round(updated_amount, 2)},
                eq={"id": inst["id"]}
            )

        result.append({
            "id": inst["id"],
            "loan_id": inst["loan_id"],
            "number": inst["number"],
            "amount": inst["amount"],
            "updated_amount": round(updated_amount, 2),
            "due_date": inst["due_date"],
            "status": status,
            "paid_at": inst.get("paid_at"),
            "days_overdue": days_overdue,
        })

    return result


@installments_router.post("/{installment_id}/pay")
async def pay_installment(installment_id: str, user: dict = Depends(require_user)):
    installment = await sb_one("installments", "*", eq={"id": installment_id})
    if not installment:
        raise HTTPException(status_code=404, detail="Parcela não encontrada")

    if not await sb_one("loans", "id", eq={"id": installment["loan_id"], "user_id": user["id"]}):
        raise HTTPException(status_code=403, detail="Acesso negado")

    if installment["status"] == "paid":
        raise HTTPException(status_code=400, detail="Parcela já paga")

    now = datetime.now(timezone.utc)
    amount_paid = installment.get("updated_amount", installment["amount"])

    await sb_insert("payments", {
        "installment_id": installment_id,
        "amount_paid": amount_paid,
        "payment_date": now.isoformat(),
    })

    await sb_update(
        "installments",
        {"status": "paid", "paid_at": now.isoformat()},
        eq={"id": installment_id}
    )

    return {
        "message": "Pagamento registrado com sucesso",
        "amount_paid": amount_paid,
    }


@installments_router.get("")
async def list_all_installments(
    user: dict = Depends(require_user),
    status: Optional[str] = None,
    period: Optional[str] = None,
    search: Optional[str] = None,
):
    loans = await sb_many("loans", "*", eq={"user_id": user["id"]})
    if not loans:
        return []

    loan_ids = [l["id"] for l in loans]
    loan_map = {l["id"]: l for l in loans}

    insts = await sb_many("installments", "*", in_={"loan_id": loan_ids})

    customer_ids = list(set(l["customer_id"] for l in loans))
    customers = await sb_many("customers", "id, name", in_={"id": customer_ids})
    cust_map = {c["id"]: c["name"] for c in customers}

    today = datetime.now(timezone.utc).date()
    result = []

    for inst in insts:
        loan = loan_map.get(inst["loan_id"])
        if not loan:
            continue

        customer_name = cust_map.get(loan["customer_id"], "N/A")
        due_date = parse_due_date(inst["due_date"])
        days_overdue = 0
        updated_amount = inst["amount"]
        current_status = inst["status"]

        if current_status == "pending" and due_date < today:
            days_overdue = (today - due_date).days
            daily_rate = (loan["interest_rate"] or 0) / 30 / 100
            updated_amount = inst["amount"] + (inst["amount"] * daily_rate * days_overdue)
            current_status = "overdue"

            await sb_update(
                "installments",
                {"status": "overdue", "updated_amount": round(updated_amount, 2)},
                eq={"id": inst["id"]}
            )

        if status and status != "all":
            if status == "pending" and current_status != "pending":
                continue
            if status == "paid" and current_status != "paid":
                continue
            if status == "overdue" and current_status != "overdue":
                continue

        if period:
            if period == "today" and due_date != today:
                continue
            if period == "next7days" and (due_date < today or due_date > today + timedelta(days=7)):
                continue
            if period == "overdue" and due_date >= today:
                continue

        if search:
            sl = search.lower()
            if sl not in customer_name.lower() and sl not in str(inst["number"]):
                continue

        result.append({
            "id": inst["id"],
            "loan_id": inst["loan_id"],
            "customer_id": loan["customer_id"],
            "customer_name": customer_name,
            "number": inst["number"],
            "total_installments": loan["number_of_installments"],
            "amount": inst["amount"],
            "updated_amount": round(updated_amount, 2),
            "due_date": inst["due_date"],
            "status": current_status,
            "paid_at": inst.get("paid_at"),
            "days_overdue": days_overdue,
            "interest_rate": loan["interest_rate"],
            "loan_amount": loan["amount"],
            "loan_total": loan["total_amount"],
        })

    result.sort(key=lambda x: x["due_date"])
    return result


@installments_router.get("/stats")
async def get_installments_stats(user: dict = Depends(require_user)):
    loans = await sb_many("loans", "id, interest_rate", eq={"user_id": user["id"]})
    if not loans:
        return {
            "total_pending": 0,
            "total_overdue": 0,
            "total_paid": 0,
            "pending_amount": 0,
            "overdue_amount": 0,
        }

    loan_ids = [l["id"] for l in loans]
    loan_map = {l["id"]: l for l in loans}
    insts = await sb_many(
        "installments",
        "loan_id, amount, status, due_date",
        in_={"loan_id": loan_ids}
    )

    today = datetime.now(timezone.utc).date()
    total_pending = 0
    total_overdue = 0
    total_paid = 0
    pending_amount = 0.0
    overdue_amount = 0.0

    for inst in insts:
        loan = loan_map.get(inst["loan_id"])
        if not loan:
            continue

        due_date = parse_due_date(inst["due_date"])
        current_status = inst["status"]
        updated_amount = inst["amount"]

        if current_status == "pending" and due_date < today:
            days_overdue = (today - due_date).days
            daily_rate = (loan["interest_rate"] or 0) / 30 / 100
            updated_amount = inst["amount"] + (inst["amount"] * daily_rate * days_overdue)
            current_status = "overdue"

        if current_status == "paid":
            total_paid += 1
        elif current_status == "overdue":
            total_overdue += 1
            overdue_amount += updated_amount
        else:
            total_pending += 1
            pending_amount += updated_amount

    return {
        "total_pending": total_pending,
        "total_overdue": total_overdue,
        "total_paid": total_paid,
        "pending_amount": round(pending_amount, 2),
        "overdue_amount": round(overdue_amount, 2),
    }


# =========================
# PAYMENTS ROUTES
# =========================

@payments_router.get("/installment/{installment_id}")
async def list_payments(installment_id: str, user: dict = Depends(require_user)):
    inst = await sb_one("installments", "loan_id", eq={"id": installment_id})
    if not inst:
        raise HTTPException(status_code=404, detail="Parcela não encontrada")

    if not await sb_one("loans", "id", eq={"id": inst["loan_id"], "user_id": user["id"]}):
        raise HTTPException(status_code=403, detail="Acesso negado")

    return await sb_many("payments", "*", eq={"installment_id": installment_id})


# =========================
# DASHBOARD ROUTES
# =========================

@dashboard_router.get("")
async def get_dashboard(user: dict = Depends(require_user)):
    user_id = user["id"]
    loans = await sb_many("loans", "*", eq={"user_id": user_id})

    total_loaned = sum(l["amount"] for l in loans)
    total_with_interest = sum(l["total_amount"] for l in loans)

    total_received = 0.0
    if loans:
        loan_ids = [l["id"] for l in loans]
        paid_insts = await sb_many("installments", "id", in_={"loan_id": loan_ids}, eq={"status": "paid"})
        if paid_insts:
            paid_inst_ids = [i["id"] for i in paid_insts]
            payments = await sb_many("payments", "amount_paid", in_={"installment_id": paid_inst_ids})
            total_received = sum(p["amount_paid"] for p in payments)

    total_pending = 0.0
    overdue_count = 0
    today = datetime.now(timezone.utc).date()

    if loans:
        loan_ids = [l["id"] for l in loans]
        unpaid = await sb_many(
            "installments",
            "updated_amount, amount, due_date",
            in_={"loan_id": loan_ids},
            neq={"status": "paid"}
        )
        for inst in unpaid:
            total_pending += inst.get("updated_amount", inst["amount"])
            if parse_due_date(inst["due_date"]) < today:
                overdue_count += 1

    customers_count = await sb_count("customers", eq={"user_id": user_id})

    return {
        "total_loaned": round(total_loaned, 2),
        "total_with_interest": round(total_with_interest, 2),
        "total_received": round(total_received, 2),
        "total_pending": round(total_pending, 2),
        "customers_count": customers_count,
        "overdue_count": overdue_count,
        "loans_count": len(loans),
    }


# =========================
# SETTINGS ROUTES
# =========================

@settings_router.get("")
async def get_user_settings(user: dict = Depends(require_user)):
    u = await sb_one(
        "users",
        "id, name, email, created_at, default_interest_rate, default_interval_days",
        eq={"id": user["id"]}
    )
    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return {
        "id": u["id"],
        "name": u["name"],
        "email": u["email"],
        "created_at": u.get("created_at"),
        "preferences": {
            "default_interest_rate": u.get("default_interest_rate"),
            "default_interval_days": u.get("default_interval_days"),
        }
    }


@settings_router.put("/account")
async def update_account(data: UserSettingsUpdate, user: dict = Depends(require_user)):
    update_data = {}

    if data.name:
        update_data["name"] = data.name

    if data.email:
        email = data.email.lower()
        if await sb_one("users", "id", eq={"email": email}, neq={"id": user["id"]}):
            raise HTTPException(status_code=400, detail="Email já cadastrado por outro usuário")
        update_data["email"] = email

    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

    await sb_update("users", update_data, eq={"id": user["id"]})
    updated = await sb_one("users", "id, name, email", eq={"id": user["id"]})

    return {
        "message": "Dados atualizados com sucesso",
        "user": updated,
    }


@settings_router.put("/password")
async def change_password(data: PasswordChangeRequest, user: dict = Depends(require_user)):
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não coincidem")

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="A nova senha deve ter pelo menos 6 caracteres"
        )

    u = await sb_one("users", "password_hash", eq={"id": user["id"]})
    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if not verify_password(data.current_password, u["password_hash"]):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")

    await sb_update(
        "users",
        {"password_hash": hash_password(data.new_password)},
        eq={"id": user["id"]}
    )

    return {"message": "Senha alterada com sucesso"}


@settings_router.get("/preferences")
async def get_preferences(user: dict = Depends(require_user)):
    u = await sb_one(
        "users",
        "default_interest_rate, default_interval_days",
        eq={"id": user["id"]}
    )
    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return u


@settings_router.put("/preferences")
async def update_preferences(data: UserPreferencesUpdate, user: dict = Depends(require_user)):
    update_data = {}

    if data.default_interest_rate is not None:
        if data.default_interest_rate < 0 or data.default_interest_rate > 100:
            raise HTTPException(status_code=400, detail="Taxa de juros deve estar entre 0 e 100%")
        update_data["default_interest_rate"] = data.default_interest_rate

    if data.default_interval_days is not None:
        if data.default_interval_days not in [15, 30]:
            raise HTTPException(status_code=400, detail="Intervalo deve ser 15 ou 30 dias")
        update_data["default_interval_days"] = data.default_interval_days

    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhuma preferência para atualizar")

    await sb_update("users", update_data, eq={"id": user["id"]})
    return {
        "message": "Preferências atualizadas com sucesso",
        "preferences": update_data,
    }


# =========================
# ADMIN ROUTES
# =========================

@admin_router.get("/stats")
async def get_admin_stats(user: dict = Depends(require_admin)):
    total_users = await sb_count("users", eq={"role": "user"})
    loans = await sb_many("loans", "total_amount")

    return {
        "total_users": total_users,
        "total_loans": len(loans),
        "total_amount": round(sum(l["total_amount"] for l in loans), 2),
    }


@admin_router.get("/users")
async def list_users(user: dict = Depends(require_admin)):
    return await sb_many(
        "users",
        "id, name, email, role, is_blocked, created_at",
        eq={"role": "user"}
    )

@admin_router.get("/creditors")
async def list_creditors(user: dict = Depends(require_admin)):
    creditors = await sb_many(
        "users",
        "id, name, email, role, is_blocked, created_at",
        eq={"role": "user"},
        order="created_at"
    )

    result = []
    today = datetime.now(timezone.utc).date()

    for creditor in creditors:
        creditor_id = creditor["id"]

        customers = await sb_many(
            "customers",
            "id",
            eq={"user_id": creditor_id}
        )

        loans = await sb_many(
            "loans",
            "id, user_id, customer_id, amount, total_amount, interest_rate",
            eq={"user_id": creditor_id}
        )

        total_open_installments = 0
        total_overdue_installments = 0
        total_overdue_amount = 0.0

        if loans:
            loan_ids = [loan["id"] for loan in loans]
            loan_map = {loan["id"]: loan for loan in loans}

            installments = await sb_many(
                "installments",
                "id, loan_id, amount, updated_amount, due_date, status",
                in_={"loan_id": loan_ids},
                neq={"status": "paid"}
            )

            for inst in installments:
                loan = loan_map.get(inst["loan_id"])

                if not loan:
                    continue

                due_date = parse_due_date(inst["due_date"])
                current_status = inst["status"]
                updated_amount = inst.get("updated_amount") or inst["amount"]

                if due_date < today:
                    days_overdue = (today - due_date).days
                    daily_rate = (loan["interest_rate"] or 0) / 30 / 100
                    updated_amount = inst["amount"] + (inst["amount"] * daily_rate * days_overdue)
                    current_status = "overdue"

                total_open_installments += 1

                if current_status == "overdue":
                    total_overdue_installments += 1
                    total_overdue_amount += updated_amount

        result.append({
            "id": creditor["id"],
            "name": creditor["name"],
            "email": creditor["email"],
            "is_blocked": creditor.get("is_blocked", False),
            "created_at": creditor.get("created_at"),
            "total_customers": len(customers),
            "total_loans": len(loans),
            "total_open_installments": total_open_installments,
            "total_overdue_installments": total_overdue_installments,
            "total_overdue_amount": round(total_overdue_amount, 2),
        })

    return result


@admin_router.get("/users/{user_id}")
async def get_user(user_id: str, user: dict = Depends(require_admin)):
    u = await sb_one(
        "users",
        "id, name, email, role, is_blocked, created_at",
        eq={"id": user_id}
    )
    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return u


@admin_router.post("/users/{user_id}/block")
async def block_user(user_id: str, user: dict = Depends(require_admin)):
    target = await sb_one("users", "role", eq={"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target["role"] == "admin":
        raise HTTPException(status_code=400, detail="Não é possível bloquear um administrador")

    await sb_update("users", {"is_blocked": True}, eq={"id": user_id})
    return {"message": "Usuário bloqueado com sucesso"}


@admin_router.post("/users/{user_id}/unblock")
async def unblock_user(user_id: str, user: dict = Depends(require_admin)):
    if not await sb_one("users", "id", eq={"id": user_id}):
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    await sb_update("users", {"is_blocked": False}, eq={"id": user_id})
    return {"message": "Usuário desbloqueado com sucesso"}


@admin_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_admin)):
    target = await sb_one("users", "role", eq={"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target["role"] == "admin":
        raise HTTPException(status_code=400, detail="Não é possível excluir um administrador")

    await sb_delete("users", eq={"id": user_id})
    return {"message": "Usuário excluído com sucesso"}


@admin_router.post("/users")
async def admin_create_user(data: AdminCreateUser, user: dict = Depends(require_admin)):
    email = data.email.lower()

    if await sb_one("users", "id", eq={"email": email}):
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    rows = await sb_insert("users", {
        "name": data.name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "user",
        "is_blocked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    u = rows[0]
    return {
        "id": u["id"],
        "name": u["name"],
        "email": u["email"],
        "role": u["role"],
        "is_blocked": u["is_blocked"],
        "created_at": u["created_at"],
    }


@admin_router.put("/users/{user_id}")
async def admin_update_user(user_id: str, data: AdminUpdateUser, user: dict = Depends(require_admin)):
    target = await sb_one("users", "role", eq={"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target["role"] == "admin":
        raise HTTPException(status_code=400, detail="Não é possível editar um administrador")

    update_data = {}

    if data.name:
        update_data["name"] = data.name

    if data.email:
        email = data.email.lower()
        if await sb_one("users", "id", eq={"email": email}, neq={"id": user_id}):
            raise HTTPException(status_code=400, detail="Email já cadastrado por outro usuário")
        update_data["email"] = email

    if data.password:
        update_data["password_hash"] = hash_password(data.password)

    if update_data:
        await sb_update("users", update_data, eq={"id": user_id})

    return await sb_one(
        "users",
        "id, name, email, role, is_blocked, created_at",
        eq={"id": user_id}
    )


# =========================
# UTILITY / HEALTH ROUTES
# =========================

@api_router.get("/")
async def api_root():
    return {
        "message": "CrediControl API",
        "version": "2.0.1",
        "supabase_initialized": supabase is not None,
    }


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "CrediControl API",
        "version": "2.0.1",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "supabase_initialized": supabase is not None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/simulate-loan")
async def simulate_loan(data: SimulateLoanRequest):
    if data.installments <= 0:
        raise HTTPException(status_code=400, detail="Número de parcelas deve ser maior que zero")

    interest = data.amount * (data.rate / 100)
    total = data.amount + interest
    installment_value = total / data.installments

    return {
        "interest": round(interest, 2),
        "total": round(total, 2),
        "installment_value": round(installment_value, 2),
    }


# =========================
# INCLUDE ROUTERS
# =========================

api_router.include_router(auth_router)
api_router.include_router(customers_router)
api_router.include_router(loans_router)
api_router.include_router(installments_router)
api_router.include_router(payments_router)
api_router.include_router(dashboard_router)
api_router.include_router(settings_router)
api_router.include_router(admin_router)

app.include_router(api_router)


# =========================
# CORS
# =========================

cors_origins = [FRONTEND_URL, "http://localhost:3000"]
if "preview.emergentagent.com" in FRONTEND_URL:
    cors_origins.append(FRONTEND_URL.replace("https://", "http://"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(cors_origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# STARTUP
# =========================

@app.on_event("startup")
async def startup_event():
    global supabase

    logger.info("Iniciando aplicação...")

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        logger.error("SUPABASE_URL e/ou SUPABASE_SERVICE_KEY não configurados")
        supabase = None
    else:
        try:
            supabase = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            logger.info("Supabase client initialized")
        except Exception as e:
            supabase = None
            logger.exception(f"Erro ao inicializar Supabase: {e}")

    admin_email = os.getenv("ADMIN_EMAIL", "admin@credicontrol.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    if supabase is not None:
        try:
            existing = await sb_one("users", "id, password_hash", eq={"email": admin_email})

            if not existing:
                await sb_insert("users", {
                    "email": admin_email,
                    "password_hash": hash_password(admin_password),
                    "name": "Administrador",
                    "role": "admin",
                    "is_blocked": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
                logger.info(f"Admin user created: {admin_email}")

            elif not verify_password(admin_password, existing["password_hash"]):
                await sb_update(
                    "users",
                    {"password_hash": hash_password(admin_password)},
                    eq={"id": existing["id"]}
                )
                logger.info(f"Admin password updated: {admin_email}")

        except Exception as e:
            logger.warning(f"Admin seed skipped (tables may not exist yet): {e}")

    try:
        credentials_path = ROOT_DIR / "memory" / "test_credentials.md"
        credentials_path.parent.mkdir(parents=True, exist_ok=True)

        with open(credentials_path, "w", encoding="utf-8") as f:
            f.write(f"""# Test Credentials

## Admin
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Test User 1
- Email: joao@teste.com
- Password: 123456
- Role: user

## Test User 2
- Email: teste2@teste.com
- Password: 123456
- Role: user

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- POST /api/auth/refresh
""")

        logger.info(f"Test credentials written to: {credentials_path}")

    except Exception as e:
        logger.warning(f"Falha ao escrever arquivo de credenciais: {e}")