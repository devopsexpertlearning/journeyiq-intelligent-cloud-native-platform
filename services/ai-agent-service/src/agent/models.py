import os
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import AzureChatOpenAI
from langchain_core.language_models.chat_models import BaseChatModel

def get_llm() -> BaseChatModel:
    provider = os.getenv("LLM_PROVIDER", "groq").lower()
    
    if provider == "groq":
        return ChatGroq(
            temperature=0, 
            model_name=os.getenv("GROQ_MODEL_NAME", "llama3-70b-8192"),
            api_key=os.getenv("GROQ_API_KEY")
        )
    elif provider == "gemini":
        return ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL_NAME", "gemini-pro"),
            google_api_key=os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        )
    elif provider == "azure":
        return AzureChatOpenAI(
            azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
            api_version="2023-05-15",
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
    else:
        # Default fallback or error
        raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")
