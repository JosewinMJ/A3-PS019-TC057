import re
import yaml
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings

class RulesEngine:
    def __init__(self, rules_path: Optional[Path] = None):
        self.rules_path = rules_path or settings.RULES_PATH
        self.config: Dict[str, Any] = {}
        self.compiled_column_patterns: Dict[str, List[re.Pattern]] = {}
        self.compiled_negative_column_patterns: Dict[str, List[re.Pattern]] = {}
        self.compiled_value_patterns: Dict[str, List[re.Pattern]] = {}
        self.load_rules()

    def load_rules(self) -> None:
        if not self.rules_path.exists():
            raise FileNotFoundError(f"Rules configuration file not found at {self.rules_path}")

        with open(self.rules_path, "r", encoding="utf-8") as f:
            content = f.read()

        parsed = self.validate_and_parse_yaml(content)
        self.config = parsed
        self._compile_patterns()

    @staticmethod
    def validate_and_parse_yaml(yaml_content: str) -> Dict[str, Any]:
        """Safely parses and validates rule configuration structure."""
        try:
            data = yaml.safe_load(yaml_content)
        except Exception as e:
            raise ValueError(f"Malformed YAML configuration: {str(e)}")

        if not isinstance(data, dict):
            raise ValueError("Root configuration must be a mapping/dictionary")

        if "classes" not in data or not isinstance(data["classes"], dict):
            raise ValueError("Configuration must contain a 'classes' dictionary")

        required_classes = ["person_name", "email_address", "phone_number", "government_id", "date_of_birth"]
        for rc in required_classes:
            if rc not in data["classes"]:
                raise ValueError(f"Missing required data class definition: '{rc}'")

            c_def = data["classes"][rc]
            if not isinstance(c_def, dict):
                raise ValueError(f"Class '{rc}' must be a dictionary definition")
            if "column_patterns" not in c_def or not isinstance(c_def["column_patterns"], list):
                raise ValueError(f"Class '{rc}' must include 'column_patterns' list")
            if "value_patterns" not in c_def or not isinstance(c_def["value_patterns"], list):
                raise ValueError(f"Class '{rc}' must include 'value_patterns' list")
            if "scoring" not in c_def or not isinstance(c_def["scoring"], dict):
                raise ValueError(f"Class '{rc}' must include 'scoring' weights dictionary")

            # Validate regex compilation to catch bad patterns early
            for pat in c_def.get("column_patterns", []):
                try:
                    re.compile(pat)
                except re.error as e:
                    raise ValueError(f"Invalid column regex in '{rc}': {pat} ({e})")

            for pat in c_def.get("value_patterns", []):
                try:
                    re.compile(pat)
                except re.error as e:
                    raise ValueError(f"Invalid value regex in '{rc}': {pat} ({e})")

        return data

    def _compile_patterns(self) -> None:
        self.compiled_column_patterns.clear()
        self.compiled_negative_column_patterns.clear()
        self.compiled_value_patterns.clear()

        classes = self.config.get("classes", {})
        for class_name, c_def in classes.items():
            self.compiled_column_patterns[class_name] = [
                re.compile(p) for p in c_def.get("column_patterns", [])
            ]
            self.compiled_negative_column_patterns[class_name] = [
                re.compile(p) for p in c_def.get("negative_column_patterns", [])
            ]
            self.compiled_value_patterns[class_name] = [
                re.compile(p) for p in c_def.get("value_patterns", [])
            ]

    def get_classes(self) -> Dict[str, Any]:
        return self.config.get("classes", {})

    def get_candidate_threshold(self) -> float:
        return float(self.config.get("sampling", {}).get("candidate_confidence_threshold", 0.50))

    def update_rules_content(self, new_yaml_content: str) -> None:
        """Validates and updates rules file atomically."""
        parsed = self.validate_and_parse_yaml(new_yaml_content)
        with open(self.rules_path, "w", encoding="utf-8") as f:
            f.write(new_yaml_content)
        self.config = parsed
        self._compile_patterns()

rules_engine = RulesEngine()
