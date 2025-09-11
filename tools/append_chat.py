#!/usr/bin/env python3
"""
Append a message to ChatIA.md with timestamp.
Usage:
  python tools/append_chat.py --message "Text to append"
  echo "Text" | python tools/append_chat.py
"""
import sys
import argparse
from datetime import datetime
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description='Append a message to ChatIA.md')
    parser.add_argument('--message', '-m', help='Message text to append. If omitted, reads stdin.')
    args = parser.parse_args()

    if args.message:
        msg = args.message.strip()
    else:
        # read from stdin
        msg = sys.stdin.read().strip()

    if not msg:
        print('No message provided. Use --message or pipe text to the script.')
        sys.exit(1)

    # locate ChatIA.md relative to this script (assumes repository root layout)
    repo_root = Path(__file__).resolve().parents[1]
    chat_file = repo_root / 'ChatIA.md'

    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    entry = f"\n\n---\n\n**Mensagem adicionada em {timestamp}**\n\n{msg}\n"

    try:
        with chat_file.open('a', encoding='utf-8') as f:
            f.write(entry)
        print(f'Appended message to {chat_file}')
    except Exception as e:
        print('Error writing to ChatIA.md:', e)
        sys.exit(1)

if __name__ == '__main__':
    main()
