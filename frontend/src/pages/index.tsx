import Reservations from './Reservations';
import ActivityHistory from './ActivityHistory';
import { Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/reservations" element={<Reservations />} />
  <Route path="/activity-history" element={<ActivityHistory />} />
</Routes> 