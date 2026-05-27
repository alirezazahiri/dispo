package sse

import (
	"strconv"
	"strings"
)

// Event is a parsed Server-Sent Events message block.
type Event struct {
	ID    string
	Event string
	Data  string
	Retry *int64
}

// Parser incrementally parses text/event-stream bodies.
type Parser struct {
	buffer string
}

// Parse appends chunk to the internal buffer and returns complete events.
func (p *Parser) Parse(chunk string) []Event {
	p.buffer += chunk

	var events []Event
	for {
		separator := strings.Index(p.buffer, "\n\n")
		if separator == -1 {
			separator = strings.Index(p.buffer, "\r\n\r\n")
			if separator == -1 {
				break
			}
			block := p.buffer[:separator]
			p.buffer = p.buffer[separator+4:]
			if event, ok := parseEventBlock(block); ok {
				events = append(events, event)
			}
			continue
		}

		block := p.buffer[:separator]
		p.buffer = p.buffer[separator+2:]
		if event, ok := parseEventBlock(block); ok {
			events = append(events, event)
		}
	}

	return events
}

func parseEventBlock(block string) (Event, bool) {
	lines := strings.Split(block, "\n")
	var dataLines []string
	var event Event
	hasContent := false

	for _, line := range lines {
		line = strings.TrimRight(line, "\r")
		if line == "" || strings.HasPrefix(line, ":") {
			continue
		}

		field, value, ok := strings.Cut(line, ":")
		if !ok {
			field = line
			value = ""
		} else if strings.HasPrefix(value, " ") {
			value = value[1:]
		}

		switch field {
		case "event":
			event.Event = value
			hasContent = true
		case "data":
			dataLines = append(dataLines, value)
			hasContent = true
		case "id":
			event.ID = value
			hasContent = true
		case "retry":
			if retry, err := strconv.ParseInt(value, 10, 64); err == nil {
				event.Retry = &retry
			}
			hasContent = true
		}
	}

	if !hasContent {
		return Event{}, false
	}

	event.Data = strings.Join(dataLines, "\n")
	return event, true
}
