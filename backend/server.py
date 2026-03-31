from dotenv import load_dotenv
load_dotenv()
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        if user.get("is_blocked", False):
            raise HTTPException(status_code=403, detail="Usuário bloqueado")
        return {
            "id": str(user["_id"]),
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
    interest_rate: float  # Monthly %
    number_of_installments: int
    start_date: str  # ISO date string
    interval_days: int  # 15 or 30

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

# Settings models
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
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    hashed = hash_password(data.password)
    user_doc = {
        "name": data.name,
        "email": email,
        "password_hash": hashed,
        "role": "user",
        "is_blocked": False,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
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
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_until = attempts.get("lockout_until")
        if lockout_until and datetime.now(timezone.utc) < lockout_until:
            raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em 15 minutos.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {"lockout_until": datetime.now(timezone.utc) + timedelta(minutes=15)}
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    if user.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="Usuário bloqueado")
    
    # Clear attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
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
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        access_token = create_access_token(str(user["_id"]), user["email"], user["role"])
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

@customers_router.get("", response_model=List[CustomerResponse])
async def list_customers(user: dict = Depends(require_user)):
    customers = await db.customers.find({"user_id": user["id"]}).to_list(1000)
    return [
        CustomerResponse(
            id=str(c["_id"]),
            user_id=c["user_id"],
            name=c["name"],
            phone=c["phone"],
            email=c.get("email"),
            document=c.get("document"),
            address=c.get("address"),
            notes=c.get("notes"),
            is_referral=c.get("is_referral", False),
            referral_name=c.get("referral_name"),
            referral_phone=c.get("referral_phone"),
            created_at=c["created_at"]
        ) for c in customers
    ]

@customers_router.post("", response_model=CustomerResponse)
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
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.customers.insert_one(doc)
    return CustomerResponse(
        id=str(result.inserted_id),
        user_id=user["id"],
        name=data.name,
        phone=data.phone,
        email=data.email,
        document=data.document,
        address=data.address,
        notes=data.notes,
        is_referral=data.is_referral,
        referral_name=data.referral_name if data.is_referral else None,
        referral_phone=data.referral_phone if data.is_referral else None,
        created_at=doc["created_at"]
    )

@customers_router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, user: dict = Depends(require_user)):
    customer = await db.customers.find_one({"_id": ObjectId(customer_id), "user_id": user["id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return CustomerResponse(
        id=str(customer["_id"]),
        user_id=customer["user_id"],
        name=customer["name"],
        phone=customer["phone"],
        email=customer.get("email"),
        document=customer.get("document"),
        address=customer.get("address"),
        notes=customer.get("notes"),
        is_referral=customer.get("is_referral", False),
        referral_name=customer.get("referral_name"),
        referral_phone=customer.get("referral_phone"),
        created_at=customer["created_at"]
    )

@customers_router.get("/{customer_id}/status")
async def get_customer_status(customer_id: str, user: dict = Depends(require_user)):
    """Get customer status: no_loans (orange), on_time (green), overdue (red)"""
    customer = await db.customers.find_one({"_id": ObjectId(customer_id), "user_id": user["id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Check if customer has any loans
    loans = await db.loans.find({"customer_id": customer_id}).to_list(100)
    
    if not loans:
        return {
            "status": "no_loans",
            "label": "Sem Empréstimo",
            "total_loans": 0,
            "total_pending": 0,
            "total_overdue": 0
        }
    
    total_pending = 0
    total_overdue = 0
    today = datetime.now(timezone.utc).date()
    
    for loan in loans:
        installments = await db.installments.find({"loan_id": str(loan["_id"]), "status": {"$ne": "paid"}}).to_list(100)
        for inst in installments:
            due_date = datetime.strptime(inst["due_date"], "%Y-%m-%d").date()
            if due_date < today:
                total_overdue += 1
            else:
                total_pending += 1
    
    if total_overdue > 0:
        return {
            "status": "overdue",
            "label": "Atrasado",
            "total_loans": len(loans),
            "total_pending": total_pending,
            "total_overdue": total_overdue
        }
    else:
        return {
            "status": "on_time",
            "label": "Em Dia",
            "total_loans": len(loans),
            "total_pending": total_pending,
            "total_overdue": 0
        }

@customers_router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, data: CustomerUpdate, user: dict = Depends(require_user)):
    customer = await db.customers.find_one({"_id": ObjectId(customer_id), "user_id": user["id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    update_data = {}
    for k, v in data.model_dump().items():
        if v is not None:
            # Handle referral fields specially
            if k == "is_referral" and v == False:
                update_data["is_referral"] = False
                update_data["referral_name"] = None
                update_data["referral_phone"] = None
            else:
                update_data[k] = v
    
    if update_data:
        await db.customers.update_one({"_id": ObjectId(customer_id)}, {"$set": update_data})
    
    updated = await db.customers.find_one({"_id": ObjectId(customer_id)})
    return CustomerResponse(
        id=str(updated["_id"]),
        user_id=updated["user_id"],
        name=updated["name"],
        phone=updated["phone"],
        email=updated.get("email"),
        document=updated.get("document"),
        address=updated.get("address"),
        notes=updated.get("notes"),
        is_referral=updated.get("is_referral", False),
        referral_name=updated.get("referral_name"),
        referral_phone=updated.get("referral_phone"),
        created_at=updated["created_at"]
    )

@customers_router.delete("/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(require_user)):
    customer = await db.customers.find_one({"_id": ObjectId(customer_id), "user_id": user["id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Check if customer has loans
    loans = await db.loans.find_one({"customer_id": customer_id})
    if loans:
        raise HTTPException(status_code=400, detail="Não é possível excluir cliente com empréstimos ativos")
    
    await db.customers.delete_one({"_id": ObjectId(customer_id)})
    return {"message": "Cliente excluído com sucesso"}

# ============== LOANS ROUTES ==============

@loans_router.get("", response_model=List[LoanResponse])
async def list_loans(user: dict = Depends(require_user)):
    loans = await db.loans.find({"user_id": user["id"]}).to_list(1000)
    result = []
    for loan in loans:
        customer = await db.customers.find_one({"_id": ObjectId(loan["customer_id"])})
        result.append(LoanResponse(
            id=str(loan["_id"]),
            user_id=loan["user_id"],
            customer_id=loan["customer_id"],
            customer_name=customer["name"] if customer else "N/A",
            amount=loan["amount"],
            interest_rate=loan["interest_rate"],
            total_amount=loan["total_amount"],
            number_of_installments=loan["number_of_installments"],
            start_date=loan["start_date"],
            interval_days=loan["interval_days"],
            created_at=loan["created_at"]
        ))
    return result

@loans_router.post("", response_model=LoanResponse)
async def create_loan(data: LoanCreate, user: dict = Depends(require_user)):
    # Verify customer belongs to user
    customer = await db.customers.find_one({"_id": ObjectId(data.customer_id), "user_id": user["id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Calculate total with interest
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
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.loans.insert_one(loan_doc)
    loan_id = str(result.inserted_id)
    
    # Generate installments
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
        await db.installments.insert_many(installments)
    
    return LoanResponse(
        id=loan_id,
        user_id=user["id"],
        customer_id=data.customer_id,
        customer_name=customer["name"],
        amount=data.amount,
        interest_rate=data.interest_rate,
        total_amount=round(total_amount, 2),
        number_of_installments=data.number_of_installments,
        start_date=data.start_date,
        interval_days=data.interval_days,
        created_at=loan_doc["created_at"]
    )

@loans_router.get("/{loan_id}", response_model=LoanResponse)
async def get_loan(loan_id: str, user: dict = Depends(require_user)):
    loan = await db.loans.find_one({"_id": ObjectId(loan_id), "user_id": user["id"]})
    if not loan:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")
    customer = await db.customers.find_one({"_id": ObjectId(loan["customer_id"])})
    return LoanResponse(
        id=str(loan["_id"]),
        user_id=loan["user_id"],
        customer_id=loan["customer_id"],
        customer_name=customer["name"] if customer else "N/A",
        amount=loan["amount"],
        interest_rate=loan["interest_rate"],
        total_amount=loan["total_amount"],
        number_of_installments=loan["number_of_installments"],
        start_date=loan["start_date"],
        interval_days=loan["interval_days"],
        created_at=loan["created_at"]
    )

@loans_router.delete("/{loan_id}")
async def delete_loan(loan_id: str, user: dict = Depends(require_user)):
    loan = await db.loans.find_one({"_id": ObjectId(loan_id), "user_id": user["id"]})
    if not loan:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")
    
    # Delete installments and payments
    installments = await db.installments.find({"loan_id": loan_id}).to_list(1000)
    for inst in installments:
        await db.payments.delete_many({"installment_id": str(inst["_id"])})
    await db.installments.delete_many({"loan_id": loan_id})
    await db.loans.delete_one({"_id": ObjectId(loan_id)})
    
    return {"message": "Empréstimo excluído com sucesso"}

# ============== INSTALLMENTS ROUTES ==============

@installments_router.get("/loan/{loan_id}", response_model=List[InstallmentResponse])
async def list_installments(loan_id: str, user: dict = Depends(require_user)):
    # Verify loan belongs to user
    loan = await db.loans.find_one({"_id": ObjectId(loan_id), "user_id": user["id"]})
    if not loan:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")
    
    installments = await db.installments.find({"loan_id": loan_id}).sort("number", 1).to_list(1000)
    today = datetime.now(timezone.utc).date()
    result = []
    
    for inst in installments:
        due_date = datetime.strptime(inst["due_date"], "%Y-%m-%d").date()
        days_overdue = 0
        updated_amount = inst["amount"]
        status = inst["status"]
        
        if status == "pending" and due_date < today:
            days_overdue = (today - due_date).days
            # Calculate daily interest: monthly_rate / 30
            daily_rate = loan["interest_rate"] / 30 / 100
            updated_amount = inst["amount"] + (inst["amount"] * daily_rate * days_overdue)
            status = "overdue"
            # Update in database
            await db.installments.update_one(
                {"_id": inst["_id"]},
                {"$set": {"status": "overdue", "updated_amount": round(updated_amount, 2)}}
            )
        
        result.append(InstallmentResponse(
            id=str(inst["_id"]),
            loan_id=inst["loan_id"],
            number=inst["number"],
            amount=inst["amount"],
            updated_amount=round(updated_amount, 2),
            due_date=inst["due_date"],
            status=status,
            paid_at=inst.get("paid_at"),
            days_overdue=days_overdue
        ))
    
    return result

@installments_router.post("/{installment_id}/pay")
async def pay_installment(installment_id: str, user: dict = Depends(require_user)):
    installment = await db.installments.find_one({"_id": ObjectId(installment_id)})
    if not installment:
        raise HTTPException(status_code=404, detail="Parcela não encontrada")
    
    # Verify loan belongs to user
    loan = await db.loans.find_one({"_id": ObjectId(installment["loan_id"]), "user_id": user["id"]})
    if not loan:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if installment["status"] == "paid":
        raise HTTPException(status_code=400, detail="Parcela já paga")
    
    now = datetime.now(timezone.utc)
    amount_paid = installment.get("updated_amount", installment["amount"])
    
    # Create payment record
    payment = {
        "installment_id": installment_id,
        "amount_paid": amount_paid,
        "payment_date": now
    }
    await db.payments.insert_one(payment)
    
    # Update installment
    await db.installments.update_one(
        {"_id": ObjectId(installment_id)},
        {"$set": {"status": "paid", "paid_at": now}}
    )
    
    return {"message": "Pagamento registrado com sucesso", "amount_paid": amount_paid}

@installments_router.get("")
async def list_all_installments(
    user: dict = Depends(require_user),
    status: Optional[str] = None,
    period: Optional[str] = None,
    search: Optional[str] = None
):
    """List all installments for the user with optional filters"""
    # Get all loans for the user
    loans = await db.loans.find({"user_id": user["id"]}).to_list(1000)
    loan_ids = [str(loan["_id"]) for loan in loans]
    loan_map = {str(loan["_id"]): loan for loan in loans}
    
    if not loan_ids:
        return []
    
    # Get all installments for these loans
    query = {"loan_id": {"$in": loan_ids}}
    installments = await db.installments.find(query).to_list(10000)
    
    today = datetime.now(timezone.utc).date()
    result = []
    
    for inst in installments:
        loan = loan_map.get(inst["loan_id"])
        if not loan:
            continue
            
        # Get customer info
        customer = await db.customers.find_one({"_id": ObjectId(loan["customer_id"])})
        customer_name = customer["name"] if customer else "N/A"
        
        due_date = datetime.strptime(inst["due_date"], "%Y-%m-%d").date()
        days_overdue = 0
        updated_amount = inst["amount"]
        current_status = inst["status"]
        
        # Calculate overdue status and amount
        if current_status == "pending" and due_date < today:
            days_overdue = (today - due_date).days
            daily_rate = loan["interest_rate"] / 30 / 100
            updated_amount = inst["amount"] + (inst["amount"] * daily_rate * days_overdue)
            current_status = "overdue"
            # Update in database
            await db.installments.update_one(
                {"_id": inst["_id"]},
                {"$set": {"status": "overdue", "updated_amount": round(updated_amount, 2)}}
            )
        
        # Apply status filter
        if status and status != "all":
            if status == "pending" and current_status not in ["pending"]:
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
            "id": str(inst["_id"]),
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
    
    # Sort by due_date
    result.sort(key=lambda x: x["due_date"])
    
    return result

@installments_router.get("/stats")
async def get_installments_stats(user: dict = Depends(require_user)):
    """Get statistics for user's installments"""
    # Get all loans for the user
    loans = await db.loans.find({"user_id": user["id"]}).to_list(1000)
    loan_ids = [str(loan["_id"]) for loan in loans]
    loan_map = {str(loan["_id"]): loan for loan in loans}
    
    if not loan_ids:
        return {
            "total_pending": 0,
            "total_overdue": 0,
            "total_paid": 0,
            "pending_amount": 0,
            "overdue_amount": 0
        }
    
    # Get all installments for these loans
    installments = await db.installments.find({"loan_id": {"$in": loan_ids}}).to_list(10000)
    
    today = datetime.now(timezone.utc).date()
    
    total_pending = 0
    total_overdue = 0
    total_paid = 0
    pending_amount = 0
    overdue_amount = 0
    
    for inst in installments:
        loan = loan_map.get(inst["loan_id"])
        if not loan:
            continue
            
        due_date = datetime.strptime(inst["due_date"], "%Y-%m-%d").date()
        current_status = inst["status"]
        updated_amount = inst["amount"]
        
        # Calculate overdue status and amount
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

@payments_router.get("/installment/{installment_id}", response_model=List[PaymentResponse])
async def list_payments(installment_id: str, user: dict = Depends(require_user)):
    installment = await db.installments.find_one({"_id": ObjectId(installment_id)})
    if not installment:
        raise HTTPException(status_code=404, detail="Parcela não encontrada")
    
    loan = await db.loans.find_one({"_id": ObjectId(installment["loan_id"]), "user_id": user["id"]})
    if not loan:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    payments = await db.payments.find({"installment_id": installment_id}).to_list(100)
    return [
        PaymentResponse(
            id=str(p["_id"]),
            installment_id=p["installment_id"],
            amount_paid=p["amount_paid"],
            payment_date=p["payment_date"]
        ) for p in payments
    ]

# ============== DASHBOARD ROUTES ==============

@dashboard_router.get("")
async def get_dashboard(user: dict = Depends(require_user)):
    user_id = user["id"]
    
    # Total emprestado
    loans = await db.loans.find({"user_id": user_id}).to_list(1000)
    total_loaned = sum(loan["amount"] for loan in loans)
    total_with_interest = sum(loan["total_amount"] for loan in loans)
    
    # Total recebido
    total_received = 0
    for loan in loans:
        installments = await db.installments.find({"loan_id": str(loan["_id"]), "status": "paid"}).to_list(1000)
        for inst in installments:
            payments = await db.payments.find({"installment_id": str(inst["_id"])}).to_list(100)
            total_received += sum(p["amount_paid"] for p in payments)
    
    # Total a receber
    total_pending = 0
    overdue_count = 0
    today = datetime.now(timezone.utc).date()
    
    for loan in loans:
        installments = await db.installments.find({"loan_id": str(loan["_id"]), "status": {"$ne": "paid"}}).to_list(1000)
        for inst in installments:
            total_pending += inst.get("updated_amount", inst["amount"])
            due_date = datetime.strptime(inst["due_date"], "%Y-%m-%d").date()
            if due_date < today:
                overdue_count += 1
    
    # Número de clientes
    customers_count = await db.customers.count_documents({"user_id": user_id})
    
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
    """Get current user settings"""
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])}, {"password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {
        "id": str(user_doc["_id"]),
        "name": user_doc["name"],
        "email": user_doc["email"],
        "created_at": user_doc.get("created_at"),
        "preferences": {
            "default_interest_rate": user_doc.get("default_interest_rate"),
            "default_interval_days": user_doc.get("default_interval_days")
        }
    }

@settings_router.put("/account")
async def update_account(data: UserSettingsUpdate, user: dict = Depends(require_user)):
    """Update user account (name, email)"""
    update_data = {}
    
    if data.name:
        update_data["name"] = data.name
    
    if data.email:
        email = data.email.lower()
        # Check if email is already used by another user
        existing = await db.users.find_one({"email": email, "_id": {"$ne": ObjectId(user["id"])}})
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado por outro usuário")
        update_data["email"] = email
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update_data})
    
    # Get updated user
    updated = await db.users.find_one({"_id": ObjectId(user["id"])}, {"password_hash": 0})
    return {
        "message": "Dados atualizados com sucesso",
        "user": {
            "id": str(updated["_id"]),
            "name": updated["name"],
            "email": updated["email"]
        }
    }

@settings_router.put("/password")
async def change_password(data: PasswordChangeRequest, user: dict = Depends(require_user)):
    """Change user password"""
    # Validate passwords match
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="As senhas não coincidem")
    
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="A nova senha deve ter pelo menos 6 caracteres")
    
    # Get user with password
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verify current password
    if not verify_password(data.current_password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    
    # Hash new password and update
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Senha alterada com sucesso"}

@settings_router.get("/preferences")
async def get_preferences(user: dict = Depends(require_user)):
    """Get user preferences"""
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {
        "default_interest_rate": user_doc.get("default_interest_rate"),
        "default_interval_days": user_doc.get("default_interval_days")
    }

@settings_router.put("/preferences")
async def update_preferences(data: UserPreferencesUpdate, user: dict = Depends(require_user)):
    """Update user preferences"""
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
    
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update_data})
    
    return {
        "message": "Preferências atualizadas com sucesso",
        "preferences": update_data
    }

# ============== ADMIN ROUTES ==============

@admin_router.get("/stats")
async def get_admin_stats(user: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({"role": "user"})
    total_loans = await db.loans.count_documents({})
    
    # Total movimentado
    loans = await db.loans.find({}).to_list(10000)
    total_amount = sum(loan["total_amount"] for loan in loans)
    
    return {
        "total_users": total_users,
        "total_loans": total_loans,
        "total_amount": round(total_amount, 2)
    }

@admin_router.get("/users")
async def list_users(user: dict = Depends(require_admin)):
    users = await db.users.find({"role": "user"}, {"password_hash": 0}).to_list(1000)
    return [
        {
            "id": str(u["_id"]),
            "name": u["name"],
            "email": u["email"],
            "role": u["role"],
            "is_blocked": u.get("is_blocked", False),
            "created_at": u.get("created_at")
        } for u in users
    ]

@admin_router.get("/users/{user_id}")
async def get_user(user_id: str, user: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {
        "id": str(target_user["_id"]),
        "name": target_user["name"],
        "email": target_user["email"],
        "role": target_user["role"],
        "is_blocked": target_user.get("is_blocked", False),
        "created_at": target_user.get("created_at")
    }

@admin_router.post("/users/{user_id}/block")
async def block_user(user_id: str, user: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target_user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Não é possível bloquear um administrador")
    
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_blocked": True}})
    return {"message": "Usuário bloqueado com sucesso"}

@admin_router.post("/users/{user_id}/unblock")
async def unblock_user(user_id: str, user: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_blocked": False}})
    return {"message": "Usuário desbloqueado com sucesso"}

@admin_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target_user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Não é possível excluir um administrador")
    
    # Delete all user data
    customers = await db.customers.find({"user_id": user_id}).to_list(1000)
    for customer in customers:
        loans = await db.loans.find({"customer_id": str(customer["_id"])}).to_list(1000)
        for loan in loans:
            await db.installments.delete_many({"loan_id": str(loan["_id"])})
        await db.loans.delete_many({"customer_id": str(customer["_id"])})
    await db.customers.delete_many({"user_id": user_id})
    await db.loans.delete_many({"user_id": user_id})
    await db.users.delete_one({"_id": ObjectId(user_id)})
    
    return {"message": "Usuário excluído com sucesso"}

# Models for admin user management
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
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    hashed = hash_password(data.password)
    user_doc = {
        "name": data.name,
        "email": email,
        "password_hash": hashed,
        "role": "user",
        "is_blocked": False,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    
    return {
        "id": str(result.inserted_id),
        "name": data.name,
        "email": email,
        "role": "user",
        "is_blocked": False,
        "created_at": user_doc["created_at"]
    }

@admin_router.put("/users/{user_id}")
async def admin_update_user(user_id: str, data: AdminUpdateUser, user: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target_user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Não é possível editar um administrador")
    
    update_data = {}
    if data.name:
        update_data["name"] = data.name
    if data.email:
        email = data.email.lower()
        # Check if email is already used by another user
        existing = await db.users.find_one({"email": email, "_id": {"$ne": ObjectId(user_id)}})
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado por outro usuário")
        update_data["email"] = email
    if data.password:
        update_data["password_hash"] = hash_password(data.password)
    
    if update_data:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    
    updated = await db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
    return {
        "id": str(updated["_id"]),
        "name": updated["name"],
        "email": updated["email"],
        "role": updated["role"],
        "is_blocked": updated.get("is_blocked", False),
        "created_at": updated.get("created_at")
    }

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
    return {"message": "CrediControl API", "version": "1.0.0"}

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

# Startup event - seed admin and create indexes
@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.customers.create_index("user_id")
    await db.loans.create_index("user_id")
    await db.loans.create_index("customer_id")
    await db.installments.create_index("loan_id")
    await db.payments.create_index("installment_id")
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@credicontrol.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Administrador",
            "role": "admin",
            "is_blocked": False,
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")
    
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
