"""
JSON Schema Validator

Utilities for validating events and API payloads against JSON schemas.
"""
import json
import jsonschema
from pathlib import Path
from typing import Dict, Any

# Path to schema files
SCHEMA_DIR = Path(__file__).parent / "examples"


def load_schema(schema_name: str) -> Dict[str, Any]:
    """
    Load a JSON schema from file.
    
    Args:
        schema_name: Name of the schema file (e.g., 'booking.created.v1.json')
        
    Returns:
        Schema dictionary
    """
    schema_path = SCHEMA_DIR / schema_name
    with open(schema_path, 'r') as f:
        return json.load(f)


def validate_event(event_data: Dict[str, Any], schema_name: str) -> bool:
    """
    Validate an event against its JSON schema.
    
    Args:
        event_data: Event data to validate
        schema_name: Name of the schema file
        
    Returns:
        True if valid
        
    Raises:
        jsonschema.ValidationError: If validation fails
        
    Example:
        >>> event = {'event_type': 'booking.created', 'booking_id': 'b123'}
        >>> validate_event(event, 'booking.created.v1.json')
        True
    """
    schema = load_schema(schema_name)
    jsonschema.validate(instance=event_data, schema=schema)
    return True


def is_valid_event(event_data: Dict[str, Any], schema_name: str) -> bool:
    """
    Check if an event is valid without raising an exception.
    
    Args:
        event_data: Event data to validate
        schema_name: Name of the schema file
        
    Returns:
        True if valid, False otherwise
    """
    try:
        validate_event(event_data, schema_name)
        return True
    except jsonschema.ValidationError:
        return False
