require 'json'

def parse_flags(flags)
  flag = 0
  flags.each_char do |c|
    case c
    when 'x' then flag |= Regexp::EXTENDED
    when 'i' then flag |= Regexp::IGNORECASE
    when 'm' then flag |= Regexp::MULTILINE
    when 'n' then flag |= Regexp::NOENCODING
    else raise "invalid flag: #{c}"
    end
  end
  flag
end

def serialize(match_or_error, time)
  time = (time * 1000).to_i
  case match_or_error
  when nil
    {
      type: 'no match',
      time: time,
    }
  when Exception
    error = match_or_error
    {
      type: 'error',
      message: error.message,
      time: time,
    }
  when MatchData
    match = match_or_error
    {
      type: 'match',
      match: {
        index: match.begin(0),
        indices: match.to_a,
        groups: match.named_captures,
      },
      time: time,
    }
  end
end

request = JSON.parse(gets(nil), symbolize_names: true)
source = request[:source]
flags = request[:flags]
input = request[:input]

start = Time.now

begin
  regex = Regexp.new(source, parse_flags(flags))
  result = regex.match(input)
  puts JSON.dump(serialize(result, Time.now - start))
rescue => error
  puts JSON.dump(serialize(error, Time.now - start))
end
