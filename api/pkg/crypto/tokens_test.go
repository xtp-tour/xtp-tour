package crypto

import (
	"fmt"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewTokenEncryption_ValidKey(t *testing.T) {
	// Generate a valid 32-byte key
	key, err := GenerateEncryptionKey()
	require.NoError(t, err)

	os.Setenv("TOKEN_ENCRYPTION_KEY", key)
	defer os.Unsetenv("TOKEN_ENCRYPTION_KEY")

	te, err := NewTokenEncryption()
	assert.NoError(t, err)
	assert.NotNil(t, te)
}

func TestNewTokenEncryption_MissingKey(t *testing.T) {
	os.Unsetenv("TOKEN_ENCRYPTION_KEY")

	te, err := NewTokenEncryption()
	assert.Error(t, err)
	assert.Nil(t, te)
	assert.Contains(t, err.Error(), "TOKEN_ENCRYPTION_KEY environment variable is required")
}

func TestNewTokenEncryption_InvalidBase64(t *testing.T) {
	os.Setenv("TOKEN_ENCRYPTION_KEY", "invalid-base64!")
	defer os.Unsetenv("TOKEN_ENCRYPTION_KEY")

	te, err := NewTokenEncryption()
	assert.Error(t, err)
	assert.Nil(t, te)
	assert.Contains(t, err.Error(), "failed to decode encryption key")
}

func TestNewTokenEncryption_InvalidKeyLength(t *testing.T) {
	// 8-byte key (too short)
	shortKey := "dGVzdGtleQ==" // base64 encoded "testkey"
	os.Setenv("TOKEN_ENCRYPTION_KEY", shortKey)
	defer os.Unsetenv("TOKEN_ENCRYPTION_KEY")

	te, err := NewTokenEncryption()
	assert.Error(t, err)
	assert.Nil(t, te)
	assert.Contains(t, err.Error(), "encryption key must be 16, 24, or 32 bytes long")
}

func TestEncryptDecryptToken(t *testing.T) {
	// Set up encryption with a valid key
	key, err := GenerateEncryptionKey()
	require.NoError(t, err)

	os.Setenv("TOKEN_ENCRYPTION_KEY", key)
	defer os.Unsetenv("TOKEN_ENCRYPTION_KEY")

	te, err := NewTokenEncryption()
	require.NoError(t, err)

	tests := []struct {
		name      string
		plaintext string
	}{
		{"short token", "abc123"},
		{"medium token", "this-is-a-medium-length-access-token-12345"},
		{"long token", "this-is-a-very-long-access-token-that-might-be-returned-by-oauth-providers-with-lots-of-information-encoded-in-it"},
		{"special characters", "token!@#$%^&*()_+-=[]{}|;':\",./<>?"},
		{"unicode", "token-with-unicode-🔒🗝️🔐"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Encrypt
			encrypted, err := te.EncryptToken(tt.plaintext)
			assert.NoError(t, err)
			assert.NotEmpty(t, encrypted)
			assert.NotEqual(t, tt.plaintext, encrypted)

			// Decrypt
			decrypted, err := te.DecryptToken(encrypted)
			assert.NoError(t, err)
			assert.Equal(t, tt.plaintext, decrypted)
		})
	}
}

func TestEncryptDecryptToken_EmptyString(t *testing.T) {
	key, err := GenerateEncryptionKey()
	require.NoError(t, err)

	os.Setenv("TOKEN_ENCRYPTION_KEY", key)
	defer os.Unsetenv("TOKEN_ENCRYPTION_KEY")

	te, err := NewTokenEncryption()
	require.NoError(t, err)

	// Test empty string
	encrypted, err := te.EncryptToken("")
	assert.NoError(t, err)
	assert.Equal(t, "", encrypted)

	decrypted, err := te.DecryptToken("")
	assert.NoError(t, err)
	assert.Equal(t, "", decrypted)
}

func TestDecryptToken_InvalidCiphertext(t *testing.T) {
	key, err := GenerateEncryptionKey()
	require.NoError(t, err)

	os.Setenv("TOKEN_ENCRYPTION_KEY", key)
	defer os.Unsetenv("TOKEN_ENCRYPTION_KEY")

	te, err := NewTokenEncryption()
	require.NoError(t, err)

	tests := []struct {
		name       string
		ciphertext string
	}{
		{"invalid base64", "invalid-base64!"},
		{"too short", "dGVzdA=="},         // "test" in base64, too short for nonce
		{"wrong key", "YWJjZGVmZ2hpams="}, // valid base64 but encrypted with different key
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := te.DecryptToken(tt.ciphertext)
			assert.Error(t, err)
		})
	}
}

func TestEncryptionConsistency(t *testing.T) {
	key, err := GenerateEncryptionKey()
	require.NoError(t, err)

	os.Setenv("TOKEN_ENCRYPTION_KEY", key)
	defer os.Unsetenv("TOKEN_ENCRYPTION_KEY")

	te, err := NewTokenEncryption()
	require.NoError(t, err)

	plaintext := "test-token-123"

	// Encrypt the same plaintext multiple times
	encrypted1, err := te.EncryptToken(plaintext)
	assert.NoError(t, err)

	encrypted2, err := te.EncryptToken(plaintext)
	assert.NoError(t, err)

	// Should be different due to random nonce
	assert.NotEqual(t, encrypted1, encrypted2)

	// But both should decrypt to the same plaintext
	decrypted1, err := te.DecryptToken(encrypted1)
	assert.NoError(t, err)
	assert.Equal(t, plaintext, decrypted1)

	decrypted2, err := te.DecryptToken(encrypted2)
	assert.NoError(t, err)
	assert.Equal(t, plaintext, decrypted2)
}

func TestGenerateEncryptionKey(t *testing.T) {
	key1, err := GenerateEncryptionKey()
	assert.NoError(t, err)
	assert.NotEmpty(t, key1)

	key2, err := GenerateEncryptionKey()
	assert.NoError(t, err)
	assert.NotEmpty(t, key2)

	// Should generate different keys each time
	assert.NotEqual(t, key1, key2)

	// Both keys should be valid for creating TokenEncryption
	for i, key := range []string{key1, key2} {
		t.Run(fmt.Sprintf("key_%d", i), func(t *testing.T) {
			os.Setenv("TOKEN_ENCRYPTION_KEY", key)
			defer os.Unsetenv("TOKEN_ENCRYPTION_KEY")

			te, err := NewTokenEncryption()
			assert.NoError(t, err)
			assert.NotNil(t, te)
		})
	}
}

func TestMustInitTokenEncryption_Success(t *testing.T) {
	key, err := GenerateEncryptionKey()
	require.NoError(t, err)

	os.Setenv("TOKEN_ENCRYPTION_KEY", key)
	defer os.Unsetenv("TOKEN_ENCRYPTION_KEY")

	// Should not panic
	te := MustInitTokenEncryption()
	assert.NotNil(t, te)
}

func TestMustInitTokenEncryption_Panic(t *testing.T) {
	os.Unsetenv("TOKEN_ENCRYPTION_KEY")

	// Should panic due to missing key
	assert.Panics(t, func() {
		MustInitTokenEncryption()
	})
}

func TestDifferentKeysCannotDecrypt(t *testing.T) {
	// Generate two different keys
	key1, err := GenerateEncryptionKey()
	require.NoError(t, err)

	key2, err := GenerateEncryptionKey()
	require.NoError(t, err)

	plaintext := "test-token-123"

	// Encrypt with first key
	os.Setenv("TOKEN_ENCRYPTION_KEY", key1)
	te1, err := NewTokenEncryption()
	require.NoError(t, err)

	encrypted, err := te1.EncryptToken(plaintext)
	require.NoError(t, err)

	// Try to decrypt with second key
	os.Setenv("TOKEN_ENCRYPTION_KEY", key2)
	te2, err := NewTokenEncryption()
	require.NoError(t, err)

	_, err = te2.DecryptToken(encrypted)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to decrypt token")

	os.Unsetenv("TOKEN_ENCRYPTION_KEY")
}
