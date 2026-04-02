from fastapi import APIRouter

router = APIRouter()

@router.post("/test-simulator")
def test():
    return {"message": "simulator funcionando"}
