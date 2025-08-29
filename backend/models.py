from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Experience(BaseModel):
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    bullets: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    isInternship: Optional[bool] = None

class Project(BaseModel):
    name: str
    link: Optional[str] = None
    description: Optional[str] = None
    bullets: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)

class Education(BaseModel):
    school: str
    degree: Optional[str] = None
    graduation: Optional[str] = None
    details: List[str] = Field(default_factory=list)

class Links(BaseModel):
    github: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    portfolio: Optional[str] = None
    other: Dict[str, str] = Field(default_factory=dict)

class UserProfile(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    links: Optional[Links] = None
    skills: List[str] = Field(default_factory=list)
    experiences: List[Experience] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    internships: List[Experience] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)

class JobSpec(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: str

class Options(BaseModel):
    maxExperiences: int = 3
    maxProjects: int = 2
    maxSkills: int = 10
    maxAchievements: int = 3
    compile: bool = True  # return pdfBase64

class GenerateRequest(BaseModel):
    user: UserProfile
    job: JobSpec
    options: Optional[Options] = None

class GenerateResponse(BaseModel):
    latex: str
    pdfBase64: Optional[str] = None
