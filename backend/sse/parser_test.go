package sse

import "testing"

func TestParserSingleEvent(t *testing.T) {
	var parser Parser
	events := parser.Parse("event: tick\ndata: hello\n\n")
	if len(events) != 1 {
		t.Fatalf("expected 1 event, got %d", len(events))
	}
	if events[0].Event != "tick" {
		t.Fatalf("expected event tick, got %q", events[0].Event)
	}
	if events[0].Data != "hello" {
		t.Fatalf("expected data hello, got %q", events[0].Data)
	}
}

func TestParserMultilineData(t *testing.T) {
	var parser Parser
	events := parser.Parse("data: line1\ndata: line2\n\n")
	if len(events) != 1 {
		t.Fatalf("expected 1 event, got %d", len(events))
	}
	if events[0].Data != "line1\nline2" {
		t.Fatalf("unexpected data: %q", events[0].Data)
	}
}

func TestParserIncremental(t *testing.T) {
	var parser Parser
	events := parser.Parse("data: hel")
	if len(events) != 0 {
		t.Fatalf("expected no complete events yet")
	}
	events = parser.Parse("lo\n\n")
	if len(events) != 1 || events[0].Data != "hello" {
		t.Fatalf("unexpected events: %+v", events)
	}
}

func TestParserRetryAndID(t *testing.T) {
	var parser Parser
	events := parser.Parse("id: 42\nretry: 5000\ndata: ping\n\n")
	if len(events) != 1 {
		t.Fatalf("expected 1 event, got %d", len(events))
	}
	if events[0].ID != "42" {
		t.Fatalf("expected id 42, got %q", events[0].ID)
	}
	if events[0].Retry == nil || *events[0].Retry != 5000 {
		t.Fatalf("expected retry 5000, got %+v", events[0].Retry)
	}
}
