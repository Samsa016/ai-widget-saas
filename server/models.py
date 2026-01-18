from database import Base
from sqlalchemy import Column, Integer, String

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    url = Column(String)
    bot_name = Column(String)
    primary_color = Column(String)
    welcome_message = Column(String)