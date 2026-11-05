"""
HFQ MySQL Keepalive
===================
Checks if MySQL (port 3306) is accepting connections.
If it's down, attempts to start the MySQL service and
retries until it comes back up.

Run:  python keepalive.py
"""

import socket
import subprocess
import sys
import time
from datetime import datetime

HOST = "127.0.0.1"
PORT = 3306
CHECK_INTERVAL_SECONDS = 10
START_TIMEOUT_SECONDS = 30


def log(message: str) -> None:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}", flush=True)


def is_mysql_up() -> bool:
    """Return True if a TCP connection to MySQL succeeds."""
    try:
        with socket.create_connection((HOST, PORT), timeout=3):
            return True
    except OSError:
        return False


def start_mysql() -> None:
    """Attempt to start MySQL via common Windows service names."""
    candidates = ["mysql", "mysql80", "mariadb"]
    for service in candidates:
        log(f"Trying to start service '{service}'...")
        try:
            result = subprocess.run(
                ["net", "start", service],
                capture_output=True,
                text=True,
                timeout=START_TIMEOUT_SECONDS,
            )
            if result.returncode == 0:
                log(f"Service '{service}' started successfully.")
                return
            # "already started" is fine too
            if "already started" in (result.stdout + result.stderr).lower():
                log(f"Service '{service}' was already running.")
                return
        except FileNotFoundError:
            # `net` not available or service doesn't exist
            continue
        except subprocess.TimeoutExpired:
            log(f"Timed out starting '{service}'.")
            continue

    log("No standard MySQL service found via 'net start'.")


def main() -> None:
    log(f"HFQ MySQL keepalive started. Watching {HOST}:{PORT}...")

    while True:
        if is_mysql_up():
            log("MySQL is UP.")
        else:
            log("MySQL is DOWN. Attempting to start...")
            start_mysql()

            # Wait a bit and re-check
            deadline = time.time() + START_TIMEOUT_SECONDS
            while time.time() < deadline:
                time.sleep(2)
                if is_mysql_up():
                    log("MySQL is now UP after start attempt.")
                    break
            else:
                log("MySQL did not come up. Will retry next cycle.")

        time.sleep(CHECK_INTERVAL_SECONDS)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("Keepalive stopped by user.")
        sys.exit(0)
