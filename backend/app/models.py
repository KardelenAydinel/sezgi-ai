from pydantic import BaseModel

class ExampleRequest(BaseModel):
    text: str
