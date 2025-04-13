import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';
import HomeView from './views/HomeView.vue';
import DronesView from './views/DronesView.vue';
import HistoryView from './views/HistoryView.vue';
import StatsView from './views/StatsView.vue';
import AchievementsView from './views/AchievementsView.vue';
import DroneFormView from './views/DroneFormView.vue';
import ChecklistsView from './views/ChecklistsView.vue';
import ActiveChecklistView from './views/ActiveChecklistView.vue';
import FlightLogFormView from './views/FlightLogFormView.vue';
import LogDetailView from './views/LogDetailView.vue';

// Using hash mode (#) for GitHub Pages compatibility
// This prevents 404 errors when refreshing pages or accessing deep links

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  {
    path: '/drones',
    name: 'Drones',
    component: DronesView
  },
  {
    path: '/drones/add',
    name: 'AddDrone',
    component: DroneFormView
  },
  {
    path: '/drones/edit/:id',
    name: 'EditDrone',
    component: DroneFormView,
    props: true
  },
  {
    path: '/checklists',
    name: 'Checklists',
    component: ChecklistsView
  },
  {
    path: '/checklists/active/:droneId',
    name: 'ActiveChecklist',
    component: ActiveChecklistView,
    props: true
  },
  {
    path: '/log/add',
    name: 'AddFlightLog',
    component: FlightLogFormView,
    props: (route: RouteLocationNormalized) => ({
        droneId: route.query.droneId,
        checklistId: route.query.checklistId,
        logId: undefined // Ensure logId is undefined for add mode
    })
  },
  {
    path: '/log/edit/:logId', // Route for editing log
    name: 'EditFlightLog',
    component: FlightLogFormView,
    props: true // Pass route params (logId) as props
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryView
  },
  {
    path: '/history/:logId',
    name: 'LogDetail',
    component: LogDetailView,
    props: true
  },
  {
    path: '/stats',
    name: 'Stats',
    component: StatsView
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: AchievementsView
  },
  // Add more routes as needed
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

export default router; 