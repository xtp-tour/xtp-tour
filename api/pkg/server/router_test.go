package server

func init() {
}

// func Test_RouterPing(t *testing.T) {
// 	// arrange
// 	w := httptest.NewRecorder()
// 	req, _ := http.NewRequest("GET", "/ping", nil)

// 	// Pass nil for DB connection in tests
// 	r := NewRouter(defaultHttpConfig, nil, false).fizz.Engine()

// 	// act
// 	r.ServeHTTP(w, req)

// 	// assert
// 	assert.Equal(t, 200, w.Code)
// 	assert.Contains(t, w.Body.String(), "pong")
// }

// func Test_RouterGet(t *testing.T) {
// 	// Pass nil for DB connection in tests
// 	r := NewRouter(defaultHttpConfig, nil, false).fizz.Engine()
// 	t.Run("PUT", func(tt *testing.T) {
// 		w := httptest.NewRecorder()
// 		req, _ := http.NewRequest("PUT", "/things/bar", strings.NewReader(`{ "value": "Thing value" }`))
// 		// act
// 		r.ServeHTTP(w, req)

// 		// assert
// 		assert.Equal(t, 201, w.Code)
// 	})

// 	t.Run("GET", func(tt *testing.T) {
// 		w := httptest.NewRecorder()
// 		req, _ := http.NewRequest("GET", "/things/bar", nil)

// 		// act
// 		r.ServeHTTP(w, req)

// 		// assert
// 		assert.Equal(t, 200, w.Code)
// 	})

// }
