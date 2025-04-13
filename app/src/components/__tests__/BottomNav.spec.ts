import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';

import BottomNav from '../layout/BottomNav.vue'; // Adjust path as necessary

// Minimal router setup for testing router-links
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/drones', component: { template: '<div>Drones</div>' } },
    { path: '/checklists', component: { template: '<div>Checklists</div>' } },
    { path: '/history', component: { template: '<div>History</div>' } },
    { path: '/stats', component: { template: '<div>Stats</div>' } },
    { path: '/achievements', component: { template: '<div>Achievements</div>' } },
  ],
});

describe('BottomNav.vue', () => {
  it('renders all navigation items', () => {
    const wrapper = mount(BottomNav, {
      global: {
        plugins: [router]
      }
    });

    // Check for presence of link text/labels
    expect(wrapper.text()).toContain('Home');
    expect(wrapper.text()).toContain('Drones');
    expect(wrapper.text()).toContain('History');
    expect(wrapper.text()).toContain('Stats');
    expect(wrapper.text()).toContain('Achieve'); // Check short label

    // Check for the correct number of links
    expect(wrapper.findAll('.nav-item').length).toBe(6);
  });

  it('applies active class to the correct link', async () => {
    // Navigate to the Drones route before mounting
    await router.push('/drones');
    await router.isReady(); // Ensure navigation is complete

    const wrapper = mount(BottomNav, {
      global: {
        plugins: [router]
      }
    });

    const droneLink = wrapper.find('a[href="/drones"]');
    expect(droneLink.classes()).toContain('router-link-exact-active');

    const homeLink = wrapper.find('a[href="/"]');
    expect(homeLink.classes()).not.toContain('router-link-exact-active');
  });
}); 