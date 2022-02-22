package retest;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.regex.Pattern;

import com.google.gson.Gson;

public class App {
  static class Request {
    public String source;
    public String flags;
    public String input;
  }

  abstract static class Response {
    public String type;
    public long time;
  }

  static class MatchResponse extends Response {
    static class Match {
      public int index;
      public List<String> indices;
      public Map<String, String> groups;

      public Match(int index, List<String> indices, Map<String, String> groups) {
        this.index = index;
        this.indices = indices;
        this.groups = groups;
      }
    }

    public Match match;

    public MatchResponse(Match match, long time) {
      this.type = "match";
      this.match = match;
      this.time = time;
    }
  }

  static class NoMatchResponse extends Response {
    public NoMatchResponse(long time) {
      this.type = "no match";
      this.time = time;
    }
  }

  static class ErrorResponse extends Response {
    public String message;
  
    public ErrorResponse(String message, long time) {
      this.type = "error";
      this.message = message;
      this.time = time;
    }
  }

  public static void main(String[] args) {
    var gson = new Gson();
    var request = gson.fromJson(new BufferedReader(new InputStreamReader(System.in)), Request.class);
    var source = request.source;
    var flags = request.flags;
    var input = request.input;

    var start = System.currentTimeMillis();

    try {
      var regex = Pattern.compile(source, parseFlags(flags));
      var matcher = regex.matcher(input);
      if (matcher.find()) {
        var namedGroupsMethod = Pattern.class.getDeclaredMethod("namedGroups");
        namedGroupsMethod.setAccessible(true);
        var namedGroups = (Map<String, Integer>) namedGroupsMethod.invoke(regex);
        var indices = new ArrayList<String>();
        for (var i = 0; i <= matcher.groupCount(); i++) {
          indices.add(matcher.group(i));
        }
        var groups = new HashMap<String, String>();
        for (var entry : namedGroups.entrySet()) {
          groups.put(entry.getKey(), matcher.group(entry.getValue()));
        }
        var match = new MatchResponse.Match(matcher.start(), indices, groups);
        var response = new MatchResponse(match, System.currentTimeMillis() - start);
        System.out.println(gson.toJson(response, response.getClass()));
      } else {
        var response = new NoMatchResponse(System.currentTimeMillis() - start);
        System.out.println(gson.toJson(response, response.getClass()));
      }
    } catch (Exception error) {
      var response = new ErrorResponse(error.getMessage(), System.currentTimeMillis() - start);
      System.out.println(gson.toJson(response, response.getClass()));
    }
  }

  static int parseFlags(String flags) {
    var flag = 0;
    for (var i = 0; i < flags.length(); i++) {
      var c = flags.charAt(i);
      switch (c) {
        case 'U':
          flag |= Pattern.UNICODE_CHARACTER_CLASS;
          break;
        case 'd':
          flag |= Pattern.UNIX_LINES;
          break;
        case 'i':
          flag |= Pattern.CASE_INSENSITIVE;
          break;
        case 'm':
          flag |= Pattern.MULTILINE;
          break;
        case 's':
          flag |= Pattern.DOTALL;
          break;
        case 'u':
          flag |= Pattern.UNICODE_CASE;
          break;
        case 'x':
          flag |= Pattern.COMMENTS;
          break;
        default:
          throw new RuntimeException("invalid flag: " + c);
      }
    }
    return flag;
  }
}
