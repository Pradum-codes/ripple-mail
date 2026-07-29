export interface MockAuthState {
  isAuthenticated: boolean;
}

function useMockAuth(): MockAuthState {
  return {
    isAuthenticated: true,
  };
}

export default useMockAuth;
