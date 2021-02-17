from graphql_api import schema
from graphql.utils import schema_printer

def write_schema():
    schema_str = schema_printer.print_schema(schema)
    with open("schema.graphql", "w") as fp:
        fp.write(schema_str)


if __name__ == "__main__":
    write_schema()
