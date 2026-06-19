import './App.css';
import Login from './Login';
import Signup from './Signup';
import PWAInstallPrompt from './PWAInstallPrompt';
import Dashboard from './Dashboard';
import DonationList from './DonationList';
import DonorList from './DonorList';
import CultivatorList from './CultivatorList';
import ReportList from './ReportList';
import GiftList from './GiftList';
import SchemeList from './SchemeList';
import TempleSettings from './TempleSettings';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
	return (
		<>
		<PWAInstallPrompt />
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/signup" element={<Signup />} />
				   <Route path="/dashboard" element={<Dashboard />} />
				   <Route path="/donations" element={<DonationList />} />
				   <Route path="/donors" element={<DonorList />} />
                   <Route path="/cultivators" element={<CultivatorList />} />
                   <Route path="/reports" element={<ReportList />} />
				   <Route path="/gifts" element={<GiftList />} />
				   <Route path="/schemes" element={<SchemeList />} />
				   <Route path="/temple-settings" element={<TempleSettings />} />
			</Routes>
		</BrowserRouter>
		</>
	);
}

export default App;