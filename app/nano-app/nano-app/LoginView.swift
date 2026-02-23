//
//  LoginView.swift
//  nano-app
//
//  Created by Jack Graziani on 2/22/26.
//


//
//  ContentView.swift
//  nano-app
//
//  Created by Jack Graziani on 2/22/26.
//

import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Spacer().frame(height: 10)
                
                Text("Sign in")
                    .font(.largeTitle.bold())
                    .frame(maxWidth: .infinity, alignment: .leading)

                // "Login with MyHamilton" (custom button; hook to your SSO flow)
                
                Spacer().frame(height: 20)
                
                Button {
                    errorMessage = nil
                    isLoading = true
                    Task {
                        defer { isLoading = false }
                        await loginWithMyHamilton()
                    }
                } label: {
                    HStack(spacing: 10) {

                        Text("Continue with MyHamilton")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                }
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 2/100, green: 17/100, blue: 45/100))
                .disabled(isLoading)
                
                
                HStack() {
                    Rectangle().frame(height: 1).foregroundStyle(.quaternary)
                    Text("or")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Rectangle().frame(height: 1).foregroundStyle(.quaternary)
                }.padding()

                // Email sign-in
                

                // Google placeholder (use GoogleSignIn SDK to implement)
                Button {
                    errorMessage = nil
                    // startGoogleSignIn()
                    errorMessage = "Google sign-in not wired yet."
                } label: {
                    HStack(spacing: 10) {
                        Image("google")
                            .resizable()
                            .frame(width: 25, height: 25)
                        
                        Text("Sign in with Google")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                }
                .buttonStyle(.bordered)
                .disabled(isLoading)

                // Sign in with Apple (real control)
                SignInWithAppleButton(.signIn) { request in
                    // Configure scopes if needed
                    request.requestedScopes = [.fullName, .email]
                } onCompletion: { result in
                    // Handle auth result (send token to your backend, etc.)
                    // switch result { ... }
                }
                .signInWithAppleButtonStyle(.black)
                .frame(height: 50)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .disabled(isLoading)

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                        .font(.footnote)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                Spacer()

                // Signup link area
                HStack(spacing: 6) {
                    Text("New here?")
                        .foregroundStyle(.secondary)
                    Button("Create an account") {
                        // Navigate to sign up screen
                    }
                    .fontWeight(.semibold)
                }
                .font(.subheadline)
                .padding(.bottom, 8)
            }
            .padding()
            .overlay {
                if isLoading {
                    ProgressView()
                        .padding()
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }
    }

    // MARK: - Actions (replace with your real auth)

    private func loginWithMyHamilton() async {
        // TODO: Implement your MyHamilton SSO flow (SAML/OAuth via a web auth session)
        // Example: use ASWebAuthenticationSession to open the IdP and capture callback URL.
        try? await Task.sleep(nanoseconds: 600_000_000)
        errorMessage = "MyHamilton sign-in not wired yet."
    }

    private func loginWithEmail(email: String, password: String) async {
        // TODO: implement your backend auth call
        try? await Task.sleep(nanoseconds: 600_000_000)
        errorMessage = "Email sign-in not wired yet."
    }
}

#Preview {
    LoginView()
}
