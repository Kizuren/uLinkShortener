package utils

import (
	"math/rand"
	"strings"
	"time"
)

const (
	letterBytes   = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	idLength      = 8
	accountLength = 8
)

var seededRand = rand.New(rand.NewSource(time.Now().UnixNano()))

func GenerateShortID() string {
	return randomString(idLength, letterBytes)
}

func GenerateAccountID() string {
	return randomString(accountLength, "0123456789")
}

func randomString(length int, charset string) string {
	b := strings.Builder{}
	b.Grow(length)
	for i := 0; i < length; i++ {
		b.WriteByte(charset[seededRand.Intn(len(charset))])
	}
	return b.String()
}
