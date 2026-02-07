from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4
import logging
from src.database import get_db
from src.models import Review

router = APIRouter(tags=["reviews"])
logger = logging.getLogger("review-service")

# Request/Response Models
class ReviewCreate(BaseModel):
    user_id: str
    resource_type: str = Field(..., pattern="^(FLIGHT|HOTEL)$")
    resource_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    user_id: str
    resource_type: str
    resource_id: str
    rating: int
    comment: Optional[str]
    created_at: datetime

class AggregatedRating(BaseModel):
    resource_id: str
    average_rating: float
    total_reviews: int
    rating_distribution: dict

@router.post("/", response_model=ReviewResponse, status_code=201)
async def create_review(
    review: ReviewCreate,
    db: AsyncSession = Depends(get_db)
):
    """Submit a new review."""
    review_id = str(uuid4())
    
    new_review = Review(
        id=review_id,
        user_id=review.user_id,
        resource_type=review.resource_type,
        resource_id=review.resource_id,
        rating=review.rating,
        comment=review.comment
    )
    
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    
    return ReviewResponse(
        id=str(new_review.id),
        user_id=str(new_review.user_id),
        resource_type=new_review.resource_type,
        resource_id=str(new_review.resource_id),
        rating=new_review.rating,
        comment=new_review.comment,
        created_at=new_review.created_at
    )

@router.get("/resource/{resource_id}")
async def get_resource_reviews(
    resource_id: str,
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Get reviews for a specific resource."""
    # Get total count
    count_result = await db.execute(
        select(func.count()).select_from(Review).where(Review.resource_id == resource_id)
    )
    total = count_result.scalar()
    
    # Get reviews
    result = await db.execute(
        select(Review)
        .where(Review.resource_id == resource_id)
        .order_by(desc(Review.created_at))
        .limit(limit)
        .offset(offset)
    )
    reviews = result.scalars().all()
    
    return {
        "resource_id": resource_id,
        "total": total,
        "reviews": [
            {
                "id": str(r.id),
                "user_id": str(r.user_id),
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at
            }
            for r in reviews
        ]
    }

@router.get("/stats/{resource_id}", response_model=AggregatedRating)
async def get_review_stats(
    resource_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get rating statistics for a resource."""
    # Calculate stats
    stats_query = select(
        func.count(Review.id).label("total"),
        func.avg(Review.rating).label("average")
    ).where(Review.resource_id == resource_id)
    
    stats_result = await db.execute(stats_query)
    stats = stats_result.one()
    
    total = stats.total or 0
    average = float(stats.average) if stats.average else 0.0
    
    # Get distribution (1-5 stars)
    dist_query = select(
        Review.rating, 
        func.count(Review.id)
    ).where(Review.resource_id == resource_id).group_by(Review.rating)
    
    dist_result = await db.execute(dist_query)
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating, count in dist_result:
        distribution[rating] = count
        
    return AggregatedRating(
        resource_id=resource_id,
        average_rating=round(average, 2),
        total_reviews=total,
        rating_distribution=distribution
    )
