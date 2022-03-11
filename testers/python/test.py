import json
import re
import sys
import time

def parse_flags(flags):
  flag = 0
  for c in flags:
    if c == 'a':
      flag |= re.ASCII
    elif c == 'b': pass
    elif c == 'i':
      flag |= re.IGNORECASE
    elif c == 'L':
      flag |= re.LOCALE
    elif c == 'm':
      flag |= re.MULTILINE
    elif c == 's':
      flag |= re.DOTALL
    elif c == 'u':
      flag |= re.UNICODE
    elif c == 'x':
      flag |= re.VERBOSE
    else:
      raise Exception(f'invalid flag: {c}')
  return flag

def serialize(match_or_error, time):
  time = int(time * 1000)
  if match_or_error is None:
    return {
      'type': 'no match',
      'time': time,
    }
  elif isinstance(match_or_error, Exception):
    error = match_or_error
    return {
      'type': 'error',
      'message': str(error),
      'time': time,
    }
  else:
    match = match_or_error

    indices = []
    for v in (match[0], *match.groups()):
      if isinstance(v, bytes):
        v = str(v, encoding='utf8')
      indices.append(v)
    groups = {}
    for k, v in match.groupdict().items():
      if isinstance(v, bytes):
        v = str(v, encoding='utf8')
      groups[k] = v

    return {
      'type': 'match',
      'match': {
        'index': match.start(),
        'indices': indices,
        'groups': groups,
      },
      'time': time,
    }

request = json.load(sys.stdin)
source = request['source']
flags = request['flags']
input = request['input']

start = time.perf_counter()

try:
  if 'b' in flags:
    source = bytes(source, encoding='utf8')
    input = bytes(input, encoding='utf8')
  regex = re.compile(source, parse_flags(flags))
  match = regex.search(input)
  print(json.dumps(serialize(match, time.perf_counter() - start)))
except Exception as error:
  print(json.dumps(serialize(error, time.perf_counter() - start)))
