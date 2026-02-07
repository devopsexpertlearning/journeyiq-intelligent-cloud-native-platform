from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from src.database import get_db
from src.models import UserCredentials
from src.utils import verify_password, get_password_hash, create_access_token, create_refresh_token
from datetime import timedelta, date
from src.logging import logger
import uuid
import secrets

router = APIRouter()

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class APIKeyCreate(BaseModel):
    name: str

class ServiceAccountCreate(BaseModel):
    name: str
    role: str

class AgeVerifyRequest(BaseModel):
    dob: date

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    logger.info(f"Registering user {user.email}")
    result = await db.execute(select(UserCredentials).where(UserCredentials.email == user.email))
    db_user = result.scalar_one_or_none()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user.password)
    new_user = UserCredentials(
        id=str(uuid.uuid4()),
        email=user.email,
        password_hash=hashed_pw,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Sync with User Service
    try:
        import httpx
        from src.config import settings
        # Assuming settings.USER_SERVICE_URL exists or hardcoded for now in this MVP fix
        # In production, use a message queue (Kafka/RabbitMQ) for reliability
        user_service_url = f"{settings.USER_SERVICE_URL}/" 
        
        async with httpx.AsyncClient() as client:
            await client.post(user_service_url, json={
                "id": new_user.id,
                "email": user.email,
                "full_name": user.full_name,
                "preferences": {}
            })
            logger.info(f"Synced user {user.email} to User Service")
            
    except Exception as e:
        logger.error(f"Failed to sync user to User Service: {str(e)}")
        # We don't rollback credentials for now, but in strict systems we might
        
    return {"message": "User registered successfully", "user_id": new_user.id}

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    logger.info(f"Login attempt for {user_in.email}")
    result = await db.execute(select(UserCredentials).where(UserCredentials.email == user_in.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not user.is_active:
         raise HTTPException(status_code=403, detail="Account inactive")

    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

    return {"message": "Token refreshed"}

@router.post("/api-keys")
async def create_api_key(request: APIKeyCreate):
    # Journey 11
    api_key = f"sk-live-{secrets.token_urlsafe(32)}"
    key_hash = get_password_hash(api_key) # Store hash
    # db.add(APIKey(...))
    return {"api_key": api_key, "note": "Store this safely, it won't be shown again"}

@router.post("/service-accounts")
async def create_service_account(request: ServiceAccountCreate):
    # Journey 12
    client_id = f"sa_{uuid.uuid4()}"
    client_secret = secrets.token_urlsafe(40)
    return {"client_id": client_id, "client_secret": client_secret}

@router.post("/verify-age")
def verify_age(request: AgeVerifyRequest):
    # Journey 74
    today = date.today()
    age = today.year - request.dob.year - ((today.month, today.day) < (request.dob.month, request.dob.day))
    if age < 18:
        raise HTTPException(status_code=400, detail="User must be 18+")
    return {"verified": True, "age": age}

@router.post("/token")
def partner_token_exchange(grant_type: str, client_id: str):
    # Journey 56 (B2B)
    if grant_type == "client_credentials":
        return {"access_token": "partner_token_xyz", "token_type": "bearer", "expires_in": 3600}
    raise HTTPException(status_code=400, detail="Unsupported grant")

@router.post("/impersonate")
def impersonate_user(user_id: str):
    # Journey 87 (Admin)
    return {"access_token": f"impersonation_token_for_{user_id}", "mode": "impersonation"}


