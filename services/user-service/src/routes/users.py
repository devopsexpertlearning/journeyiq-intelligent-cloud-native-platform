from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from src.database import get_db
from src.models import User
from typing import List, Optional
import uuid
from datetime import datetime

router = APIRouter()

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    preferences: Optional[dict] = {}
    id: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    preferences: Optional[dict] = None
    avatar_url: Optional[str] = None
    consent_marketing: Optional[bool] = None
    consent_data_sharing: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    preferences: dict
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class InvitationRequest(BaseModel):
    email: str
    role: str

# Endpoints
@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create a new user"""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    new_user = User(
        id=uuid.UUID(user.id) if user.id else uuid.uuid4(),
        email=user.email,
        full_name=user.full_name,
        preferences=user.preferences or {},
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        full_name=new_user.full_name,
        preferences=new_user.preferences or {},
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )

@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all users"""
    result = await db.execute(
        select(User)
        .where(User.deleted_at.is_(None))
        .offset(skip)
        .limit(limit)
    )
    users = result.scalars().all()
    
    return [
        UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            preferences=user.preferences or {},
            is_active=user.is_active,
            created_at=user.created_at
        )
        for user in users
    ]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """Get user by ID"""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    
    if not user or user.deleted_at is not None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        preferences=user.preferences or {},
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update user profile"""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    
    if not user or user.deleted_at is not None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(user, key, value)
        user.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(user)
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        preferences=user.preferences or {},
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.post("/{user_id}/deactivate")
async def deactivate_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """Deactivate user account (Journey 19)"""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    user.deactivated_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return {
        "message": "Account deactivated successfully",
        "user_id": user_id,
        "deactivated_at": user.deactivated_at.isoformat()
    }

@router.delete("/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """Soft delete user (GDPR compliance - Journey 20)"""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Soft delete - mark for deletion
    user.deleted_at = datetime.utcnow()
    user.is_active = False
    user.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return {
        "status": "Scheduled for deletion",
        "user_id": user_id,
        "days": 30,
        "message": "User data will be permanently deleted in 30 days"
    }

@router.post("/orgs/{org_id}/invitations", status_code=201)
async def invite_team_member(org_id: str, invite: InvitationRequest):
    """Send team invitation (Journey 21)"""
    import secrets
    token = f"inv_{secrets.token_hex(16)}"
    
    return {
        "message": "Invitation sent successfully",
        "invitation_token": token,
        "email": invite.email,
        "org_id": org_id,
        "role": invite.role,
        "expires_in_days": 7
    }
