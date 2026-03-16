import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_wQV15lqnCLea@ep-green-firefly-a195u46u-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"


def get_connection():

    try:

        conn = psycopg2.connect(
            DATABASE_URL,
            connect_timeout=10
        )

        print("Connected to NeonDB successfully")

        return conn

    except Exception as e:

        print("Database connection failed:", e)

        return None