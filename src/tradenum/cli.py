from __future__ import annotations

import argparse
import json

from tradenum.agent import TradeNumAgent
from tradenum.domain.enums import CliCommand


def main() -> None:
    parser = argparse.ArgumentParser(description="TradeNum")
    parser.add_argument("command", choices=[c.value for c in CliCommand])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    command = CliCommand(args.command)
    if command is CliCommand.SERVE:
        from tradenum.api import main as serve

        serve()
        return
    agent = TradeNumAgent()
    execute = not args.dry_run
    if command is CliCommand.HEARTBEAT:
        print(json.dumps(agent.heartbeat(execute=execute), indent=2, default=str))
    elif command is CliCommand.SCAN:
        tickets = agent.scan_once(execute=execute)
        print(json.dumps([t.model_dump(mode="json") for t in tickets], indent=2, default=str))
    elif command is CliCommand.SUPERVISE:
        tickets = agent.supervise_open()
        print(json.dumps([t.model_dump(mode="json") for t in tickets], indent=2, default=str))
    elif command is CliCommand.STATS:
        print(json.dumps(agent.ledger.stats(), indent=2))
    elif command is CliCommand.TICKETS:
        print(json.dumps([t.model_dump(mode="json") for t in agent.ledger.all()], indent=2, default=str))


if __name__ == "__main__":
    main()
