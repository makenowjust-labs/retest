use strict;
use warnings;
use utf8;
use feature qw(say);
binmode(STDOUT, ":utf8");

use Time::HiRes qw(gettimeofday tv_interval);
use JSON::PP qw(encode_json decode_json);
use Data::Dumper;

my $stdin = do { local $/; <STDIN> };
my $request = decode_json $stdin;
my $source = $request->{source};
my $flags = $request->{flags};
my $input = $request->{input};

my $start = [gettimeofday];

eval {
  my $regex = qr/(?$flags)$source/;
  my $matched = $input =~ $regex;
  if ($matched) {
    my $indices = [];
    foreach my $i (0..$#-) {
      if (defined $-[$i] and defined $+[$i]) {
        $indices->[$i] = substr $input, $-[$i], $+[$i];
      }
    }
    my $groups = {};
    foreach my $key (keys %+) {
      if (defined $+{$key}) {
        $groups->{$key} = $+{$key};
      }
    }
    say encode_json {
      type => "match",
      match => {
        index => $-[0],
        indices => $indices,
        groups => $groups,
      },
      time => int(tv_interval($start) * 1000),
    };
  } else {
    say encode_json {
      type => "no match",
      time => int(tv_interval($start) * 1000),
    };
  }
};

if ($@) {
  say encode_json {
    type => "error",
    message => $@,
    time => int(tv_interval($start) * 1000),
  };
}
