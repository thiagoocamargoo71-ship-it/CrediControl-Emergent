from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from supabase._async.client import create_client as create_async_client, AsyncClient
import os
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

# Supabase config
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_KEY']

# Global async client (initialized on startup)
supabase: AsyncClient = None

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# Check if running in production (HTTPS)
def is_production() -> bool:
    frontend_url = os.environ.get("FRONTEND_URL", "")
    return "https://" in frontend_url

# Helper to set auth cookies
def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    secure = is_production()
    samesite = "none" if secure else "lax"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=3600,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=604800,
        path="/"
    )

# Password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT Token functions
def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Auth dependency
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
        result = await supabase.table('users').select('id, name, email, role, is_blocked, created_at').eq('id', payload["sub"]).maybe_single().execute()
        user = result.data
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        if user.get("is_blocked", False):
            raise HTTPException(status_code=403, detail="Usuário bloqueado")
        return {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user.get("created_at")
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Role-based dependencies
async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    return user

async def require_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user["role"] != "user":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas usuários.")
    return user

# FastAPI App
app = FastAPI(title="CrediControl API")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Auth"])
customers_router = APIRouter(prefix="/customers", tags=["Customers"])
loans_router = APIRouter(prefix="/loans", tags=["Loans"])
installments_router = APIRouter(prefix="/installments", tags=["Installments"])
payments_router = APIRouter(prefix="/payments", tags=["Payments"])
dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
settings_router = APIRouter(prefix="/settings", tags=["Settings"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])

# Pydantic Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: Optional[datetime] = None

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

class CustomerResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    email: Optional[str] = None
    document: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_referral: bool = False
    referral_name: Optional[str] = None
    referral_phone: Optional[str] = None
    created_at: datetime

class LoanCreate(BaseModel):
    customer_id: str
    amount: float
    interest_rate: float
    number_of_installments: int
    start_date: str
    interval_days: int

class LoanResponse(BaseModel):
    id: str
    user_id: str
    customer_id: str
    customer_name: Optional[str] = None
    amount: float
    interest_rate: float
    total_amount: float
    number_of_installments: int
    start_date: str
    interval_days: int
    created_at: datetime

class InstallmentResponse(BaseModel):
    id: str
    loan_id: str
    number: int
    amount: float
    updated_amount: float
    due_date: str
    status: str
    paid_at: Optional[datetime] = None
    days_overdue: int = 0

class PaymentCreate(BaseModel):
    installment_id: str
    amount_paid: float

class PaymentResponse(BaseModel):
    id: str
    installment_id: str
    amount_paid: float
    payment_date: datetime

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

class UserPreferencesResponse(BaseModel):
    default_interest_rate: Optional[float] = None
    default_interval_days: Optional[int] = None

# ============== AUTH ROUTES ==============

@auth_router.post("/register")
async def register(data: UserRegister, response: Response):
    email = data.email.lower()
    existing = await supabase.table('users').select('id').eq('email', email).maybe_single().execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    hashed = hash_password(data.password)
    user_doc = {
        "name": data.name,
        "email": email,
        "password_hash": hashed,
        "role": "user",
        "is_blocked": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await supabase.table('users').insert(user_doc).execute()
    new_user = result.data[0]
    user_id = new_user["id"]

    access_token = create_access_token(user_id, email, "user")
    refresh_token = create_refresh_token(user_id)

    set_auth_cookies(response, access_token, refresh_token)

    return {"id": user_id, "name": data.name, "email": email, "role": "user"}

@auth_router.post("/login")
async def login(data: UserLogin, response: Response, request: Request):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    # Check brute force
    attempts_result = await supabase.table('login_attempts').select('*').eq('identifier', identifier).maybe_single().execute()
    attempts = attempts_result.data
    if attempts and attempts.get("count", 0) >= 5:
        lockout_until = attempts.get("lockout_until")
        if lockout_until:
            lockout_dt = datetime.fromisoformat(lockout_until.replace('Z', '+00:00')) if isinstance(lockout_until, str) else lockout_until
            if datetime.now(timezone.utc) < lockout_dt:
                raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em 15 minutos.")
        # Clear expired lockout
        await supabase.table('login_attempts').delete().eq('identifier', identifier).execute()
        attempts = None

    user_result = await supabase.table('users').select('*').eq('email', email).maybe_single().execute()
    user = user_result.data
    if not user or not verify_password(data.password, user["password_hash"]):
        # Increment failed attempts
        lockout_time = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        if attempts:
            await supabase.table('login_attempts').update({
                "count": attempts["count"] + 1,
                "lockout_until": lockout_time
            }).eq('identifier', identifier).execute()
        else:
            await supabase.table('login_attempts').insert({
                "identifier": identifier,
                "count": 1,
                "lockout_until": lockout_time
            }).execute()
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")

    if user.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="Usuário bloqueado")

    # Clear attempts on success
    if attempts:
        await supabase.table('login_attempts').delete().eq('identifier', identifier).execute()

    user_id = user["id"]
    access_token = create_access_token(user_id, email, user["role"])
    refresh_token = create_refresh_token(user_id)

    set_auth_cookies(response, access_token, refresh_token)

    return {"id": user_id, "name": user["name"], "email": email, "role": user["role"]}

@auth_router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@auth_router.post("/logout")
async def logout(response: Response):
    secure = is_production()
    samesite = "none" if secure else "lax"
    response.delete_cookie("access_token", path="/", secure=secure, samesite=samesite)
    response.delete_cookie("refresh_token", path="/", secure=secure, samesite=samesite)
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
        result = await supabase.table('users').select('id, email, role').eq('id', payload["sub"]).maybe_single().execute()
        user = result.data
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
            path="/"
        )
        return {"message": "Token renovado"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ============== CUSTOMERS ROUTES ==============

@customers_router.get("")
async def list_customers(user: dict = Depends(require_user)):
    result = await supabase.table('customers').select('*').eq('user_id', user["id"]).execute()
    return result.data

@customers_router.post("")
async def create_customer(data: CustomerCreate, user: dict = Depends(require_user)):
    doc = {
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await supabase.table('customers').insert(doc).execute()
    return result.data[0]

@customers_router.get("/{customer_id}")
async def get_customer(customer_id: str, user: dict = Depends(require_user)):
    result = await supabase.table('customers').select('*').eq('id', customer_id).eq('user_id', user["id"]).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return result.data

@customers_router.get("/{customer_id}/status")
async def get_customer_status(customer_id: str, user: dict = Depends(require_user)):
    customer_result = await supabase.table('customers').select('id').eq('id', customer_id).eq('user_id', user["id"]).maybe_single().execute()
    if not customer_result.data:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    loans_result = await supabase.table('loans').select('id').eq('customer_id', customer_id).execute()
    loans = loans_result.data

    if not loans:
        return {"status": "no_loans", "label": "Sem Empréstimo", "total_loans": 0, "total_pending": 0, "total_overdue": 0}

    total_pending = 0
    total_overdue = 0
    today = datetime.now(timezone.utc).date()

    loan_ids = [loan["id"] for loan in loans]
    inst_result = await supabase.table('installments').select('due_date, status').in_('loan_id', loan_ids).neq('status', 'paid').execute()

    for inst in inst_result.data:
        due_date = datetime.strptime(inst["due_date"], "%Y-%m-%d").date()
        if due_date < today:
            total_overdue += 1
        else:
            total_pending += 1

    if total_overdue > 0:
        return {"status": "overdue", "label": "Atrasado", "total_loans": len(loans), "total_pending": total_pending, "total_overdue": total_overdue}
    return {"status": "on_time", "label": "Em Dia", "total_loans": len(loans), "total_pending": total_pending, "total_overdue": 0}

@customers_router.put("/{customer_id}")
async def update_customer(customer_id: str, data: CustomerUpdate, user: dict = Depends(require_user)):
    existing = await supabase.table('customers').select('id').eq('id', customer_id).eq('user_id', user["id"]).maybe_single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    update_data = {}
    for k, v in data.model_dump().items():
        if v is not None:
            if k == "is_referral" and v is False:
                update_data["is_referral"] = False
                update_data["referral_name"] = None
                update_data["referral_phone"] = None
            else:
                update_data[k] = v

    if update_data:
        await supabase.table('customers').update(update_data).eq('id', customer_id).execute()

    result = await supabase.table('customers').select('*').eq('id', customer_id).maybe_single().execute()
    return result.data

@customers_router.delete("/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(require_user)):
    existing = await supabase.table('customers').select('id').eq('id', customer_id).eq('user_id', user["id"]).maybe_single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    loans_check = await supabase.table('loans').select('id').eq('customer_id', customer_id).limit(1).execute()
    if loans_check.data:
        raise HTTPException(status_code=400, detail="Não é possível excluir cliente com empréstimos ativos")

    await supabase.table('customers').delete().eq('id', customer_id).execute()
    return {"message": "Cliente excluído com sucesso"}

# ============== LOANS ROUTES ==============

@loans_router.get("")
async def list_loans(user: dict = Depends(require_user)):
    loans_result = await supabase.table('loans').select('*').eq('user_id', user["id"]).execute()
    loans = loans_result.data

    if not loans:
        return []

    customer_ids = list(set(l["customer_id"] for l in loans))
    customers_result = await supabase.table('customers').select('id, name').in_('id', customer_ids).execute()
    cust_map = {c["id"]: c["name"] for c in customers_result.data}

    result = []
    for loan in loans:
        loan["customer_name"] = cust_map.get(loan["customer_id"], "N/A")
        result.append(loan)
    return result

@loans_router.post("")
async def create_loan(data: LoanCreate, user: dict = Depends(require_user)):
    customer_result = await supabase.table('customers').select('id, name').eq('id', data.customer_id).eq('user_id', user["id"]).maybe_single().execute()
    if not customer_result.data:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    customer = customer_result.data

    total_amount = data.amount + (data.amount * data.interest_rate / 100)
    installment_amount = total_amount / data.number_of_installments

    loan_doc = {
        "user_id": user["id"],
        "customer_id": data.customer_id,
        "amount": data.amount,
        "interest_rate": data.interest_rate,
        "total_amount": round(total_amount, 2),
        "number_of_installments": data.number_of_installments,
        "start_date": data.start_date,
        "interval_days": data.interval_days,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    loan_result = await supabase.table('loans').insert(loan_doc).execute()
    loan = loan_result.data[0]
    loan_id = loan["id"]

    start = datetime.fromisoformat(data.start_date.replace('Z', '+00:00') if 'Z' in data.start_date else data.start_date)
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
            "paid_at": None
        })

    if installments:
        await supabase.table('installments').insert(installments).execute()

    loan["customer_name"] = customer["name"]
    return loan

@loans_router.get("/{loan_id}")
async def get_loan(loan_id: str, user: dict = Depends(require_user)):
    loan_result = await supabase.table('loans').select('*').eq('id', loan_id).eq('user_id', user["id"]).maybe_single().execute()
    if not loan_result.data:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")
    loan = loan_result.data
    customer_result = await supabase.table('customers').select('name').eq('id', loan["customer_id"]).maybe_single().execute()
    loan["customer_name"] = customer_result.data["name"] if customer_result.data else "N/A"
    return loan

@loans_router.delete("/{loan_id}")
async def delete_loan(loan_id: str, user: dict = Depends(require_user)):
    loan_result = await supabase.table('loans').select('id').eq('id', loan_id).eq('user_id', user["id"]).maybe_single().execute()
    if not loan_result.data:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")

    # CASCADE will handle installments and payments via FK constraints
    await supabase.table('loans').delete().eq('id', loan_id).execute()
    return {"message": "Empréstimo excluído com sucesso"}

# ============== INSTALLMENTS ROUTES ==============

@installments_router.get("/loan/{loan_id}")
async def list_installments(loan_id: str, user: dict = Depends(require_user)):
    loan_result = await supabase.table('loans').select('id, interest_rate').eq('id', loan_id).eq('user_id', user["id"]).maybe_single().execute()
    if not loan_result.data:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")
    loan = loan_result.data

    inst_result = await supabase.table('installments').select('*').eq('loan_id', loan_id).order('number').execute()
    today = datetime.now(timezone.utc).date()
    result = []

    for inst in inst_result.data:
        due_date = datetime.strptime(inst["due_date"], "%Y-%m-%d").date()
        days_overdue = 0
        updated_amount = inst["amount"]
        status = inst["status"]

        if status == "pending" and due_date < today:
            days_overdue = (today - due_date).days
            daily_rate = loan["interest_rate"] / 30 / 100
            updated_amount = inst["amount"] + (inst["amount"] * daily_rate * days_overdue)
            status = "overdue"
            await supabase.table('installments').update({
                "status": "overdue",
                "updated_amount": round(updated_amount, 2)
            }).eq('id', inst["id"]).execute()

        result.append({
            "id": inst["id"],
            "loan_id": inst["loan_id"],
            "number": inst["number"],
            "amount": inst["amount"],
            "updated_amount": round(updated_amount, 2),
            "due_date": inst["due_date"],
            "status": status,
            "paid_at": inst.get("paid_at"),
            "days_overdue": days_overdue
        })

    return result

@installments_router.post("/{installment_id}/pay")
async def pay_installment(installment_id: str, user: dict = Depends(require_user)):
    inst_result = await supabase.table('installments').select('*').eq('id', installment_id).maybe_single().execute()
    if not inst_result.data:
        raise HTTPException(status_code=404, detail="Parcela não encontrada")
    installment = inst_result.data

    loan_result = await supabase.table('loans').select('id').eq('id', installment["loan_id"]).eq('user_id', user["id"]).maybe_single().execute()
    if not loan_result.data:
        raise HTTPException(status_code=403, detail="Acesso negado")

    if installment["status"] == "paid":
        raise HTTPException(status_code=400, detail="Parcela já paga")

    now = datetime.now(timezone.utc)
    amount_paid = installment.get("updated_amount", installment["amount"])

    await supabase.table('payments').insert({
        "installment_id": installment_id,
        "amount_paid": amount_paid,
        "payment_date": now.isoformat()
    }).execute()

    await supabase.table('installments').update({
        "status": "paid",
        "paid_at": now.isoformat()
    }).eq('id', installment_id).execute()

    return {"message": "Pagamento registrado com sucesso", "amount_paid": amount_paid}

@installments_router.get("")
async def list_all_installments(
    user: dict = Depends(require_user),
    status: Optional[str] = None,
    period: Optional[str] = None,
    search: Optional[str] = None
):
    loans_result = await supabase.table('loans').select('*').eq('user_id', user["id"]).execute()
    loans = loans_result.data
    if not loans:
        return []

    loan_ids = [loan["id"] for loan in loans]
    loan_map = {loan["id"]: loan for loan in loans}

    inst_result = await supabase.table('installments').select('*').in_('loan_id', loan_ids).execute()

    # Get all customer names for these loans
    customer_ids = list(set(l["customer_id"] for l in loans))
    cust_result = await supabase.table('customers').select('id, name').in_('id', customer_ids).execute()
    cust_map = {c["id"]: c["name"] for c in cust_result.data}

    today = datetime.now(timezone.utc).date()
    result = []

    for inst in inst_result.data:
        loan = loan_map.get(inst["loan_id"])
        if not loan:
            continue

        customer_name = cust_map.get(loan["customer_id"], "N/A")
        due_date = datetime.strptime(inst["due_date"], "%Y-%m-%d").date()
        days_overdue = 0
        updated_amount = inst["amount"]
        current_status = inst["status"]

        if current_status == "pending" and due_date < today:
            days_overdue = (today - due_date).days
            daily_rate = loan["interest_rate"] / 30 / 100
            updated_amount = inst["amount"] + (inst["amount"] * daily_rate * days_overdue)
            current_status = "overdue"
            await supabase.table('installments').update({
                "status": "overdue",
                "updated_amount": round(updated_amount, 2)
            }).eq('id', inst["id"]).execute()

        # Apply status filter
        if status and status != "all":
            if status == "pending" and current_status != "pending":
                continue
            if status == "paid" and current_status != "paid":
                continue
            if status == "overdue" and current_status != "overdue":
                continue

        # Apply period filter
        if period:
            if period == "today" and due_date != today:
                continue
            if period == "next7days":
                if due_date < today or due_date > today + timedelta(days=7):
                    continue
            if period == "overdue" and due_date >= today:
                continue

        # Apply search filter
        if search:
            search_lower = search.lower()
            if search_lower not in customer_name.lower() and search_lower not in str(inst["number"]):
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
            "loan_total": loan["total_amount"]
        })

    result.sort(key=lambda x: x["due_date"])
    return result

@installments_router.get("/stats")
async def get_installments_stats(user: dict = Depends(require_user)):
    loans_result = await supabase.table('loans').select('id, interest_rate').eq('user_id', user["id"]).execute()
    loans = loans_result.data
    if not loans:
        return {"total_pending": 0, "total_overdue": 0, "total_paid": 0, "pending_amount": 0, "overdue_amount": 0}

    loan_ids = [loan["id"] for loan in loans]
    loan_map = {loan["id"]: loan for loan in loans}

    inst_result = await supabase.table('installments').select('loan_id, amount, status, due_date').in_('loan_id', loan_ids).execute()

    today = datetime.now(timezone.utc).date()
    total_pending = 0
    total_overdue = 0
    total_paid = 0
    pending_amount = 0
    overdue_amount = 0

    for inst in inst_result.data:
        loan = loan_map.get(inst["loan_id"])
        if not loan:
            continue

        due_date = datetime.strptime(inst["due_date"], "%Y-%m-%d").date()
        current_status = inst["status"]
        updated_amount = inst["amount"]

        if current_status == "pending" and due_date < today:
            days_overdue = (today - due_date).days
            daily_rate = loan["interest_rate"] / 30 / 100
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
        "overdue_amount": round(overdue_amount, 2)
    }

# ============== PAYMENTS ROUTES ==============

@payments_router.get("/installment/{installment_id}")
async def list_payments(installment_id: str, user: dict = Depends(require_user)):
    inst_result = await supabase.table('installments').select('loan_id').eq('id', installment_id).maybe_single().execute()
    if not inst_result.data:
        raise HTTPException(status_code=404, detail="Parcela não encontrada")

    loan_result = await supabase.table('loans').select('id').eq('id', inst_result.data["loan_id"]).eq('user_id', user["id"]).maybe_single().execute()
    if not loan_result.data:
        raise HTTPException(status_code=403, detail="Acesso negado")

    payments_result = await supabase.table('payments').select('*').eq('installment_id', installment_id).execute()
    return payments_result.data

# ============== DASHBOARD ROUTES ==============

@dashboard_router.get("")
async def get_dashboard(user: dict = Depends(require_user)):
    user_id = user["id"]

    loans_result = await supabase.table('loans').select('*').eq('user_id', user_id).execute()
    loans = loans_result.data
    total_loaned = sum(loan["amount"] for loan in loans)
    total_with_interest = sum(loan["total_amount"] for loan in loans)

    # Total received
    total_received = 0
    if loans:
        loan_ids = [loan["id"] for loan in loans]
        paid_inst_result = await supabase.table('installments').select('id').in_('loan_id', loan_ids).eq('status', 'paid').execute()
        if paid_inst_result.data:
            paid_inst_ids = [inst["id"] for inst in paid_inst_result.data]
            payments_result = await supabase.table('payments').select('amount_paid').in_('installment_id', paid_inst_ids).execute()
            total_received = sum(p["amount_paid"] for p in payments_result.data)

    # Total pending and overdue
    total_pending = 0
    overdue_count = 0
    today = datetime.now(timezone.utc).date()

    if loans:
        loan_ids = [loan["id"] for loan in loans]
        unpaid_result = await supabase.table('installments').select('updated_amount, amount, due_date').in_('loan_id', loan_ids).neq('status', 'paid').execute()
        for inst in unpaid_result.data:
            total_pending += inst.get("updated_amount", inst["amount"])
            due_date = datetime.strptime(inst["due_date"], "%Y-%m-%d").date()
            if due_date < today:
                overdue_count += 1

    # Customer count
    customers_result = await supabase.table('customers').select('id', count='exact').eq('user_id', user_id).execute()
    customers_count = customers_result.count or 0

    return {
        "total_loaned": round(total_loaned, 2),
        "total_with_interest": round(total_with_interest, 2),
        "total_received": round(total_received, 2),
        "total_pending": round(total_pending, 2),
        "customers_count": customers_count,
        "overdue_count": overdue_count,
        "loans_count": len(loans)
    }

# ============== SETTINGS ROUTES ==============

@settings_router.get("")
async def get_user_settings(user: dict = Depends(require_user)):
    result = await supabase.table('users').select('id, name, email, created_at, default_interest_rate, default_interval_days').eq('id', user["id"]).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    u = result.data
    return {
        "id": u["id"],
        "name": u["name"],
        "email": u["email"],
        "created_at": u.get("created_at"),
        "preferences": {
            "default_interest_rate": u.get("default_interest_rate"),
            "default_interval_days": u.get("default_interval_days")
        }
    }

@settings_router.put("/account")
async def update_account(data: UserSettingsUpdate, user: dict = Depends(require_user)):
    update_data = {}

    if data.name:
        update_data["name"] = data.name

    if data.email:
        email = data.email.lower()
        existing = await supabase.table('users').select('id').eq('email', email).neq('id', user["id"]).maybe_single().execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email já cadastrado por outro usuário")
        update_data["email"] = email

    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

    await supabase.table('users').update(update_data).eq('id', user["id"]).execute()

    updated = await supabase.table('users').select('id, name, email').eq('id', user["id"]).maybe_single().execute()
    return {
        "message": "Dados atualizados com sucesso",
        "user": updated.data
    }

@settings_router.put("/password")
async def change_password(data: PasswordChangeRequest, user: dict = Depends(require_user)):
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não coincidem")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="A nova senha deve ter pelo menos 6 caracteres")

    user_result = await supabase.table('users').select('password_hash').eq('id', user["id"]).maybe_single().execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if not verify_password(data.current_password, user_result.data["password_hash"]):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")

    new_hash = hash_password(data.new_password)
    await supabase.table('users').update({"password_hash": new_hash}).eq('id', user["id"]).execute()

    return {"message": "Senha alterada com sucesso"}

@settings_router.get("/preferences")
async def get_preferences(user: dict = Depends(require_user)):
    result = await supabase.table('users').select('default_interest_rate, default_interval_days').eq('id', user["id"]).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return result.data

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

    await supabase.table('users').update(update_data).eq('id', user["id"]).execute()

    return {"message": "Preferências atualizadas com sucesso", "preferences": update_data}

# ============== ADMIN ROUTES ==============

@admin_router.get("/stats")
async def get_admin_stats(user: dict = Depends(require_admin)):
    users_result = await supabase.table('users').select('id', count='exact').eq('role', 'user').execute()
    total_users = users_result.count or 0

    loans_result = await supabase.table('loans').select('total_amount').execute()
    total_loans = len(loans_result.data)
    total_amount = sum(l["total_amount"] for l in loans_result.data)

    return {
        "total_users": total_users,
        "total_loans": total_loans,
        "total_amount": round(total_amount, 2)
    }

@admin_router.get("/users")
async def list_users(user: dict = Depends(require_admin)):
    result = await supabase.table('users').select('id, name, email, role, is_blocked, created_at').eq('role', 'user').execute()
    return result.data

@admin_router.get("/users/{user_id}")
async def get_user(user_id: str, user: dict = Depends(require_admin)):
    result = await supabase.table('users').select('id, name, email, role, is_blocked, created_at').eq('id', user_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return result.data

@admin_router.post("/users/{user_id}/block")
async def block_user(user_id: str, user: dict = Depends(require_admin)):
    target = await supabase.table('users').select('role').eq('id', user_id).maybe_single().execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target.data["role"] == "admin":
        raise HTTPException(status_code=400, detail="Não é possível bloquear um administrador")

    await supabase.table('users').update({"is_blocked": True}).eq('id', user_id).execute()
    return {"message": "Usuário bloqueado com sucesso"}

@admin_router.post("/users/{user_id}/unblock")
async def unblock_user(user_id: str, user: dict = Depends(require_admin)):
    target = await supabase.table('users').select('id').eq('id', user_id).maybe_single().execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    await supabase.table('users').update({"is_blocked": False}).eq('id', user_id).execute()
    return {"message": "Usuário desbloqueado com sucesso"}

@admin_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_admin)):
    target = await supabase.table('users').select('role').eq('id', user_id).maybe_single().execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target.data["role"] == "admin":
        raise HTTPException(status_code=400, detail="Não é possível excluir um administrador")

    # CASCADE handles related data deletion via FK constraints
    await supabase.table('users').delete().eq('id', user_id).execute()
    return {"message": "Usuário excluído com sucesso"}

class AdminCreateUser(BaseModel):
    name: str
    email: EmailStr
    password: str

class AdminUpdateUser(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

@admin_router.post("/users")
async def admin_create_user(data: AdminCreateUser, user: dict = Depends(require_admin)):
    email = data.email.lower()
    existing = await supabase.table('users').select('id').eq('email', email).maybe_single().execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    hashed = hash_password(data.password)
    user_doc = {
        "name": data.name,
        "email": email,
        "password_hash": hashed,
        "role": "user",
        "is_blocked": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await supabase.table('users').insert(user_doc).execute()
    new_user = result.data[0]
    return {
        "id": new_user["id"],
        "name": new_user["name"],
        "email": new_user["email"],
        "role": new_user["role"],
        "is_blocked": new_user["is_blocked"],
        "created_at": new_user["created_at"]
    }

@admin_router.put("/users/{user_id}")
async def admin_update_user(user_id: str, data: AdminUpdateUser, user: dict = Depends(require_admin)):
    target = await supabase.table('users').select('role').eq('id', user_id).maybe_single().execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target.data["role"] == "admin":
        raise HTTPException(status_code=400, detail="Não é possível editar um administrador")

    update_data = {}
    if data.name:
        update_data["name"] = data.name
    if data.email:
        email = data.email.lower()
        existing = await supabase.table('users').select('id').eq('email', email).neq('id', user_id).maybe_single().execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email já cadastrado por outro usuário")
        update_data["email"] = email
    if data.password:
        update_data["password_hash"] = hash_password(data.password)

    if update_data:
        await supabase.table('users').update(update_data).eq('id', user_id).execute()

    updated = await supabase.table('users').select('id, name, email, role, is_blocked, created_at').eq('id', user_id).maybe_single().execute()
    return updated.data

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(customers_router)
api_router.include_router(loans_router)
api_router.include_router(installments_router)
api_router.include_router(payments_router)
api_router.include_router(dashboard_router)
api_router.include_router(settings_router)
api_router.include_router(admin_router)

@api_router.get("/")
async def root():
    return {"message": "CrediControl API", "version": "2.0.0 (Supabase)"}

app.include_router(api_router)

# CORS Middleware
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
cors_origins = [frontend_url, "http://localhost:3000"]
if "preview.emergentagent.com" in frontend_url:
    cors_origins.append(frontend_url.replace("https://", "http://"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup event
@app.on_event("startup")
async def startup_event():
    global supabase
    supabase = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    logger.info("Supabase client initialized")

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@credicontrol.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")

    try:
        existing = await supabase.table('users').select('id, password_hash').eq('email', admin_email).maybe_single().execute()
        if not existing.data:
            hashed = hash_password(admin_password)
            await supabase.table('users').insert({
                "email": admin_email,
                "password_hash": hashed,
                "name": "Administrador",
                "role": "admin",
                "is_blocked": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            logger.info(f"Admin user created: {admin_email}")
        elif not verify_password(admin_password, existing.data["password_hash"]):
            await supabase.table('users').update({
                "password_hash": hash_password(admin_password)
            }).eq('id', existing.data["id"]).execute()
            logger.info(f"Admin password updated: {admin_email}")
    except Exception as e:
        logger.warning(f"Admin seed skipped (tables may not exist yet): {e}")

    # Write test credentials
    credentials_path = Path("/app/memory/test_credentials.md")
    credentials_path.parent.mkdir(parents=True, exist_ok=True)
    with open(credentials_path, "w") as f:
        f.write(f"""# Test Credentials

## Admin
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- POST /api/auth/refresh
""")
    logger.info("Test credentials written to /app/memory/test_credentials.md")
