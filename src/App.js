import './App.css';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import DonationList from './DonationList';
import DonorList from './DonorList';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/signup" element={<Signup />} />
				   <Route path="/dashboard" element={<Dashboard />} />
				   <Route path="/donations" element={<DonationList />} />
				   <Route path="/donors" element={<DonorList />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;