package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"log/slog"
	"os"
)

// TokenEncryption handles encryption and decryption of OAuth tokens
type TokenEncryption struct {
	gcm cipher.AEAD
}

// NewTokenEncryption creates a new token encryption service
func NewTokenEncryption() (*TokenEncryption, error) {
	// Get encryption key from environment variable
	keyStr := os.Getenv("TOKEN_ENCRYPTION_KEY")
	if keyStr == "" {
		return nil, fmt.Errorf("TOKEN_ENCRYPTION_KEY environment variable is required")
	}

	// Decode the base64 key
	key, err := base64.StdEncoding.DecodeString(keyStr)
	if err != nil {
		return nil, fmt.Errorf("failed to decode encryption key: %w", err)
	}

	// Validate key length (must be 16, 24, or 32 bytes for AES)
	if len(key) != 16 && len(key) != 24 && len(key) != 32 {
		return nil, fmt.Errorf("encryption key must be 16, 24, or 32 bytes long, got %d", len(key))
	}

	// Create AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	return &TokenEncryption{gcm: gcm}, nil
}

// EncryptToken encrypts a token string and returns base64 encoded result
func (te *TokenEncryption) EncryptToken(plaintext string) (string, error) {
	if plaintext == "" {
		slog.Warn("EncryptToken called with empty plaintext - returning empty string")
		return "", nil
	}

	// Create a random nonce
	nonce := make([]byte, te.gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Encrypt the token
	ciphertext := te.gcm.Seal(nonce, nonce, []byte(plaintext), nil)

	// Return base64 encoded result
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptToken decrypts a base64 encoded token string
func (te *TokenEncryption) DecryptToken(ciphertext string) (string, error) {
	if ciphertext == "" {
		slog.Warn("DecryptToken called with empty ciphertext - returning empty string")
		return "", nil
	}

	// Decode from base64
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("failed to decode ciphertext: %w", err)
	}

	// Extract nonce
	nonceSize := te.gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, cipherData := data[:nonceSize], data[nonceSize:]

	// Decrypt
	plaintext, err := te.gcm.Open(nil, nonce, cipherData, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt token: %w", err)
	}

	return string(plaintext), nil
}

// GenerateEncryptionKey generates a new 32-byte encryption key and returns it base64 encoded
func GenerateEncryptionKey() (string, error) {
	key := make([]byte, 32) // 256-bit key
	if _, err := rand.Read(key); err != nil {
		return "", fmt.Errorf("failed to generate key: %w", err)
	}
	return base64.StdEncoding.EncodeToString(key), nil
}

// MustInitTokenEncryption initializes token encryption or panics
func MustInitTokenEncryption() *TokenEncryption {
	te, err := NewTokenEncryption()
	if err != nil {
		slog.Error("Failed to initialize token encryption", "error", err)
		panic(fmt.Sprintf("Token encryption initialization failed: %v", err))
	}
	return te
}
