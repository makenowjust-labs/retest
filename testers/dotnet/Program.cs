using System.Diagnostics;
using System.Text.Json;
using System.Text.RegularExpressions;

class Request
{
  public string? source { get; set; }
  public string? flags { get; set; }
  public string? input { get; set; }
}

abstract class Response
{
  public abstract string type { get; }
  public long time { get; set; }
}

class MatchResponse : Response
{
  public class Match
  {
    public int index { get; set; }
    public IList<string?>? indices { get; set; }
    public Dictionary<string, string?>? groups { get; set; }
  }

  public override string type { get; } = "match";
  public Match? match { get; set; }
}

class NoMatchResponse : Response
{
  public override string type { get; } = "no match";
}

class ErrorResponse : Response
{
  public override string type { get; } = "error";
  public string? message { get; set; }
}

public class Program
{
  public static void Main()
  {
    using (var reader = new StreamReader(Console.OpenStandardInput(), Console.InputEncoding))
    {
      var stdin = reader.ReadToEnd();
      var request = JsonSerializer.Deserialize<Request>(stdin);
      var source = request?.source!;
      var flags = request?.flags!;
      var input = request?.input!;

      var stopwatch = new Stopwatch();
      stopwatch.Start();
      try
      {
        var regex = new Regex(source, ParseFlags(flags));
        var match = regex.Match(input);
        stopwatch.Stop();
        var response = SerializeMatch(match, stopwatch.ElapsedMilliseconds);
        Console.WriteLine(JsonSerializer.Serialize(response, response.GetType()));
      }
      catch (Exception error)
      {
        stopwatch.Stop();
        var response = SerializeError(error, stopwatch.ElapsedMilliseconds);
        Console.WriteLine(JsonSerializer.Serialize(response, response.GetType()));
      }
    }
  }

  private static RegexOptions ParseFlags(string flags)
  {
    var flag = RegexOptions.None;
    foreach (var c in flags)
    {
      switch (c)
      {
        case 'i':
          flag |= RegexOptions.IgnoreCase;
          break;
        case 'm':
          flag |= RegexOptions.Multiline;
          break;
        case 'n':
          flag |= RegexOptions.ExplicitCapture;
          break;
        case 's':
          flag |= RegexOptions.Singleline;
          break;
        case 'x':
          flag |= RegexOptions.IgnorePatternWhitespace;
          break;
        default:
          throw new Exception($"invalid flag: {c}");
      }
    }
    return flag;
  }

  private static Response SerializeMatch(Match match, long time)
  {
    if (!match.Success)
    {
      return new NoMatchResponse()
      {
        time = time,
      };
    }

    var indices = new List<string?>();
    var groups = new Dictionary<string, string?>();

    foreach (Group group in match.Groups)
    {
      var value = group.Success ? group.Value : null;
      indices.Add(value);
      try
      {
        Convert.ToUInt32(group.Name);
      }
      catch
      {
        groups.Add(group.Name, value);
      }
    }

    return new MatchResponse
    {
      match = new MatchResponse.Match
      {
        index = match.Index,
        indices = indices,
        groups = groups,
      },
      time = time,
    };
  }

  private static Response SerializeError(Exception error, long time)
  {
    return new ErrorResponse
    {
      message = error.Message,
      time = time,
    };
  }
}
