<?php

ini_set('pcre.backtrack_limit', -1);
ini_set('pcre.recursion_limit', -1);

set_error_handler(function($severity, $message, $file, $line) {
  throw new ErrorException($message, 0, $severity, $file, $line);
});

function serializeMatchOrError($match_or_error, $time) {
  $time = (int) ($time * 1000);
  if ($match_or_error === NULL) {
    return array(
      "type" => "no match",
      "time" => $time,
    );
  } else if ($match_or_error instanceof \Throwable) {
    $error = $match_or_error;
    return array(
      "type" => "error",
      "message" => $error->getMessage(),
      "time" => $time,
    );
  } else {
    $match = $match_or_error;
    $indices = array_map(fn ($array) => $array[0], array_filter($match, 'is_int', ARRAY_FILTER_USE_KEY));
    $groups = array_map(fn ($array) => $array[0], array_filter($match, 'is_string', ARRAY_FILTER_USE_KEY));
    return array(
      "type" => "match",
      "match" => array(
        "index" => $match[0][1],
        "indices" => $indices,
        "groups" => $groups,
      ),
      "time" => $time,
    );
  }
}

$request = json_decode(fgets(STDIN));
$source = $request->source;
$flags = $request->flags;
$input = $request->input;

$start = microtime(true);

try {
  $matched = preg_match("/$source/$flags", $input, $match, PREG_OFFSET_CAPTURE | PREG_UNMATCHED_AS_NULL);
  echo json_encode(serializeMatchOrError($matched ? $match : NULL, microtime(true) - $start));
} catch (\Throwable $error) {
  echo json_encode(serializeMatchOrError($error, microtime(true) - $start));
}
