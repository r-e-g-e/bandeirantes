package main

import (
	"fmt"
	"log"
	"net/http"
)

func methodValidator(writer http.ResponseWriter, request *http.Request) {
	allowedMethods := [2]string{http.MethodGet, http.MethodPost}

	for i := 0; i < len(allowedMethods); i++ {
		fmt.Println(allowedMethods[i])
		isValid := allowedMethods[i] != request.Method
		if isValid {
			return
		}
	}
}

func errorMessage(w http.ResponseWriter) {
}

const port string = ":3010"

func main() {
	mux := http.NewServeMux()
	server := http.Server{
		Addr:    port,
		Handler: mux,
	}

	// http.HandleFunc("/hello", func(writer http.ResponseWriter, request *http.Request) {
	// 	fmt.Fprintf(writer, "Hello!")
	// })

	log.Println("HTTP server listening on port", port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
