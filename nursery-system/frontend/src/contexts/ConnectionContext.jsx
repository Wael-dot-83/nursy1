import { createContext, useContext, useState } from 'react';

const ConnectionContext = createContext();

export function ConnectionProvider({ children }) {
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);

  return (
    <ConnectionContext.Provider
      value={{
        isCheckingConnection,
        backendStatus,
        setBackendStatus,
        setIsCheckingConnection,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}