import ast
import json
import sys
import re


def analyze_scraper(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    tree = ast.parse(content)

    analysis = {
        "className": "",
        "hostName": "",
        "methods": [],
        "imports": [],
        "complexity": "simple",
        "parsingStrategy": "schema",
        "filePath": file_path,
    }

    # Extract imports
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                analysis["imports"].append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                for alias in node.names:
                    analysis["imports"].append(f"{node.module}.{alias.name}")

    # Find class definition
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            analysis["className"] = node.name

            # Extract methods
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    method_analysis = analyze_method(item, content)
                    analysis["methods"].append(method_analysis)

                    # Extract host name from host() method
                    if item.name == "host":
                        host_name = extract_host_name(item)
                        if host_name:
                            analysis["hostName"] = host_name

    # Determine complexity and parsing strategy
    analysis["complexity"] = determine_complexity(analysis)
    analysis["parsingStrategy"] = determine_parsing_strategy(analysis, content)

    return analysis


def analyze_method(method_node, content):
    method_analysis = {
        "name": method_node.name,
        "returnType": "string",
        "selectors": [],
        "schemaProperties": [],
        "complexity": 0,
        "body": "",
    }

    # Extract method body as string
    if method_node.lineno and method_node.end_lineno:
        lines = content.split("\n")
        method_body = "\n".join(lines[method_node.lineno - 1 : method_node.end_lineno])
        method_analysis["body"] = method_body

    # Extract CSS selectors
    for node in ast.walk(method_node):
        if isinstance(node, ast.Str):
            selector = extract_css_selector(node.s)
            if selector:
                method_analysis["selectors"].append(selector)

    # Extract schema.org properties
    for node in ast.walk(method_node):
        if isinstance(node, ast.Str):
            schema_prop = extract_schema_property(node.s)
            if schema_prop:
                method_analysis["schemaProperties"].append(schema_prop)

    # Calculate complexity
    method_analysis["complexity"] = calculate_method_complexity(method_node)

    # Determine return type
    if method_node.name in ["ingredients", "instructions"]:
        method_analysis["returnType"] = "string[]"
    elif method_node.name in ["total_time", "cook_time", "prep_time"]:
        method_analysis["returnType"] = "number"

    return method_analysis


def extract_host_name(method_node):
    for node in ast.walk(method_node):
        if isinstance(node, ast.Return) and isinstance(node.value, ast.Str):
            return node.value.s
    return None


def extract_css_selector(text):
    # Common CSS selector patterns
    css_patterns = [
        r"[.#][\w-]+",  # Class or ID selectors
        r'[a-zA-Z][\w-]*(?:\[[\w-]+[=~|^$*]?["\']?[^"\']*["\']?\])?',  # Element selectors with attributes
        r"[a-zA-Z][\w-]*:[\w-]+",  # Pseudo selectors
    ]

    for pattern in css_patterns:
        if re.search(pattern, text):
            return text
    return None


def extract_schema_property(text):
    # Schema.org property patterns
    schema_patterns = [
        r"recipeIngredient",
        r"recipeInstructions",
        r"totalTime",
        r"cookTime",
        r"prepTime",
        r"recipeYield",
        r"name",
        r"description",
        r"author",
        r"image",
        r"datePublished",
        r"nutrition",
    ]

    for pattern in schema_patterns:
        if pattern in text:
            return pattern
    return None


def calculate_method_complexity(method_node):
    complexity = 0

    for node in ast.walk(method_node):
        if isinstance(node, (ast.If, ast.While, ast.For)):
            complexity += 1
        elif isinstance(node, ast.Try):
            complexity += 1
        elif isinstance(node, ast.Call):
            complexity += 0.5

    return int(complexity)


def determine_complexity(analysis):
    total_complexity = sum(method["complexity"] for method in analysis["methods"])
    method_count = len(analysis["methods"])

    if total_complexity > 20 or method_count > 15:
        return "complex"
    elif total_complexity > 10 or method_count > 8:
        return "medium"
    else:
        return "simple"


def determine_parsing_strategy(analysis, content):
    _schema_count = sum(
        len(method["schemaProperties"]) for method in analysis["methods"]
    )
    selector_count = sum(len(method["selectors"]) for method in analysis["methods"])

    if "schema" in content.lower() or "json" in content.lower():
        if selector_count > 0:
            return "mixed"
        else:
            return "schema"
    else:
        return "selectors"


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python analyze_scraper.py <file_path>")
        sys.exit(1)
    file_path = sys.argv[1]
    analysis = analyze_scraper(file_path)
    print(json.dumps(analysis))
