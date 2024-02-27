package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
)

func methodValidator(writer http.ResponseWriter, request *http.Request) {
	allowedMethods := []string{"GET", "POST"}

	for i := 0; i < len(allowedMethods); i++ {
		var result bool = strings.ToLower(allowedMethods[i]) != strings.ToLower(request.Method)

	}

}

func main() {
	http.HandleFunc("/hello", func(writer http.ResponseWriter, request *http.Request) {
		something, err := request.Body.Read()
		log.Println(something)
		fmt.Fprintf(writer, "Hello!")
	})

	port := ":3010"
	fmt.Println("HTTP server listening on port", port)

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}
