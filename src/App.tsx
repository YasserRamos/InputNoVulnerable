import { Route, Routes } from 'react-router-dom';
import './App.css'
import AboutBlank from './Mock/aboutblank';
import Login from './View/UsuariosView';

function App() {

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Login />

        }
      />

      <Route
        path="/login"
        element={
          <AboutBlank />
        }
      />
    </Routes>
  )
}

export default App
