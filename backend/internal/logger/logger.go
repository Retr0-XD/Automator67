package logger

import (
	"errors"
	"fmt"
	"log"
	"os"
	"time"
)

// Logger wraps standard logging with context
type Logger struct {
	label string
	level string
}

// New creates a new logger with a label
func New(label string) *Logger {
	level := os.Getenv("LOG_LEVEL")
	if level == "" {
		level = "info"
	}
	return &Logger{
		label: label,
		level: level,
	}
}

// Info logs an info message
func (l *Logger) Info(msg string, args ...interface{}) {
	l.log("INFO", msg, args...)
}

// Warn logs a warning message
func (l *Logger) Warn(msg string, args ...interface{}) {
	l.log("WARN", msg, args...)
}

// Error logs an error message
func (l *Logger) Error(msg string, args ...interface{}) {
	l.log("ERROR", msg, args...)
}

// Debug logs a debug message
func (l *Logger) Debug(msg string, args ...interface{}) {
	if l.level == "debug" {
		l.log("DEBUG", msg, args...)
	}
}

func (l *Logger) log(level string, msg string, args ...interface{}) {
	timestamp := time.Now().Format(time.RFC3339)
	logMsg := fmt.Sprintf("[%s] %s [%s]: %s", timestamp, l.label, level, msg)
	
	if len(args) > 0 {
		logMsg = fmt.Sprintf("%s %v", logMsg, args)
	}
	
	log.Println(logMsg)
}

// Global logger
var defaultLogger = New("controller")

func Info(msg string, args ...interface{}) {
	defaultLogger.Info(msg, args...)
}

func Warn(msg string, args ...interface{}) {
	defaultLogger.Warn(msg, args...)
}

func Error(msg string, args ...interface{}) {
	defaultLogger.Error(msg, args...)
}

func Debug(msg string, args ...interface{}) {
	defaultLogger.Debug(msg, args...)
}
// ErrorWithMessage logs an error and returns an error
func ErrorWithMessage(msg string, args ...interface{}) error {
	Error(msg, args...)
	return errors.New(fmt.Sprintf("%s %v", msg, args))
}