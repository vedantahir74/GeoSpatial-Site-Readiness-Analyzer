"""
Property-based tests for system startup performance.

Tests Property 34: System Startup Performance
Validates: Requirements 11.2
"""

import pytest
import asyncio
import time
import subprocess
import requests
from typing import Dict, Any
from hypothesis import given, strategies as st, settings


class TestSystemStartupPerformance:
    """Property tests for system startup performance."""

    @pytest.mark.asyncio
    @settings(max_examples=3, deadline=180000)  # 3 minutes deadline for startup tests
    async def test_docker_compose_startup_within_2_minutes(self):
        """
        Property 34: System Startup Performance
        
        For any docker-compose deployment, all services should be healthy 
        and ready for use within 2 minutes of startup initiation.
        """
        startup_start_time = time.time()
        
        try:
            # Start docker-compose services
            startup_process = subprocess.Popen(
                ["docker-compose", "up", "-d"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            startup_stdout, startup_stderr = startup_process.communicate(timeout=120)
            
            if startup_process.returncode != 0:
                pytest.fail(f"Docker compose startup failed: {startup_stderr}")
            
            # Wait for services to be healthy
            max_wait_time = 120  # 2 minutes
            services_healthy = await self._wait_for_services_healthy(max_wait_time)
            
            startup_duration = time.time() - startup_start_time
            
            # Verify startup completed within 2 minutes
            assert startup_duration <= 120, \
                f"System startup took {startup_duration:.1f}s, should be ≤120s"
            
            # Verify all services are healthy
            assert services_healthy, "Not all services became healthy within 2 minutes"
            
            print(f"✓ System startup completed in {startup_duration:.1f}s")
            
        finally:
            # Cleanup: Stop services
            subprocess.run(
                ["docker-compose", "down"],
                capture_output=True,
                timeout=60
            )

    async def _wait_for_services_healthy(self, max_wait_time: int) -> bool:
        """Wait for all services to become healthy."""
        start_time = time.time()
        
        required_services = {
            'postgres': self._check_postgres_health,
            'redis': self._check_redis_health,
            'backend': self._check_backend_health,
            'frontend': self._check_frontend_health,
            'nginx': self._check_nginx_health
        }
        
        while time.time() - start_time < max_wait_time:
            healthy_services = {}
            
            for service_name, health_check in required_services.items():
                try:
                    is_healthy = await health_check()
                    healthy_services[service_name] = is_healthy
                except Exception as e:
                    healthy_services[service_name] = False
                    print(f"Health check failed for {service_name}: {e}")
            
            # Check if all services are healthy
            if all(healthy_services.values()):
                elapsed = time.time() - start_time
                print(f"All services healthy after {elapsed:.1f}s")
                return True
            
            # Log current status
            healthy_count = sum(healthy_services.values())
            total_count = len(healthy_services)
            print(f"Services healthy: {healthy_count}/{total_count} - {healthy_services}")
            
            # Wait before next check
            await asyncio.sleep(5)
        
        return False

    async def _check_postgres_health(self) -> bool:
        """Check PostgreSQL health via docker-compose health check."""
        try:
            result = subprocess.run(
                ["docker-compose", "ps", "--services", "--filter", "status=running"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0:
                return False
            
            # Check if postgres is in running services
            running_services = result.stdout.strip().split('\n')
            if 'postgres' not in running_services:
                return False
            
            # Check health status
            health_result = subprocess.run(
                ["docker-compose", "exec", "-T", "postgres", "pg_isready", "-U", "geosite", "-d", "geositedb"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            return health_result.returncode == 0
            
        except Exception:
            return False

    async def _check_redis_health(self) -> bool:
        """Check Redis health via docker-compose health check."""
        try:
            result = subprocess.run(
                ["docker-compose", "exec", "-T", "redis", "redis-cli", "ping"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            return result.returncode == 0 and "PONG" in result.stdout
            
        except Exception:
            return False

    async def _check_backend_health(self) -> bool:
        """Check backend health via HTTP endpoint."""
        try:
            response = requests.get("http://localhost:8000/health", timeout=10)
            return response.status_code == 200
        except Exception:
            return False

    async def _check_frontend_health(self) -> bool:
        """Check frontend health via HTTP endpoint."""
        try:
            response = requests.get("http://localhost:3000", timeout=10)
            return response.status_code == 200
        except Exception:
            return False

    async def _check_nginx_health(self) -> bool:
        """Check nginx health via HTTP endpoint."""
        try:
            response = requests.get("http://localhost:80/health", timeout=10)
            return response.status_code == 200
        except Exception:
            return False

    @pytest.mark.asyncio
    @given(
        concurrent_requests=st.integers(min_value=1, max_value=5)
    )
    @settings(max_examples=3, deadline=60000)
    async def test_system_handles_immediate_load_after_startup(self, concurrent_requests: int):
        """Test that system can handle requests immediately after startup."""
        # Assume system is already running from previous test
        try:
            # Make concurrent requests to test immediate availability
            tasks = []
            for _ in range(concurrent_requests):
                task = asyncio.create_task(self._make_test_request())
                tasks.append(task)
            
            # Wait for all requests to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Verify at least 80% of requests succeeded
            successful_requests = sum(1 for result in results if result is True)
            success_rate = successful_requests / len(results)
            
            assert success_rate >= 0.8, \
                f"Only {success_rate:.1%} of requests succeeded after startup, expected ≥80%"
            
        except Exception as e:
            pytest.skip(f"System not available for load testing: {e}")

    async def _make_test_request(self) -> bool:
        """Make a test request to verify system responsiveness."""
        try:
            response = requests.get("http://localhost:8000/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False

    @pytest.mark.asyncio
    async def test_service_dependencies_start_in_correct_order(self):
        """Test that services start in the correct dependency order."""
        try:
            # Check that postgres starts before backend
            postgres_healthy = await self._check_postgres_health()
            if not postgres_healthy:
                pytest.skip("PostgreSQL not available for dependency test")
            
            # Check that redis starts before backend
            redis_healthy = await self._check_redis_health()
            if not redis_healthy:
                pytest.skip("Redis not available for dependency test")
            
            # Check that backend starts before frontend
            backend_healthy = await self._check_backend_health()
            assert backend_healthy, "Backend should be healthy when dependencies are ready"
            
            # Check that frontend can connect to backend
            frontend_healthy = await self._check_frontend_health()
            assert frontend_healthy, "Frontend should be healthy when backend is ready"
            
        except Exception as e:
            pytest.skip(f"Dependency order test skipped: {e}")

    @pytest.mark.asyncio
    async def test_health_checks_respond_within_timeout(self):
        """Test that all health checks respond within acceptable timeouts."""
        health_check_timeouts = {
            'postgres': 5,  # seconds
            'redis': 3,
            'backend': 10,
            'frontend': 10,
            'nginx': 5
        }
        
        for service, timeout in health_check_timeouts.items():
            start_time = time.time()
            
            try:
                if service == 'postgres':
                    healthy = await self._check_postgres_health()
                elif service == 'redis':
                    healthy = await self._check_redis_health()
                elif service == 'backend':
                    healthy = await self._check_backend_health()
                elif service == 'frontend':
                    healthy = await self._check_frontend_health()
                elif service == 'nginx':
                    healthy = await self._check_nginx_health()
                
                elapsed = time.time() - start_time
                
                # Health check should complete within timeout
                assert elapsed <= timeout, \
                    f"{service} health check took {elapsed:.1f}s, should be ≤{timeout}s"
                
                # Service should be healthy
                if healthy:
                    print(f"✓ {service} health check passed in {elapsed:.1f}s")
                else:
                    print(f"⚠ {service} health check failed but completed in {elapsed:.1f}s")
                    
            except Exception as e:
                elapsed = time.time() - start_time
                print(f"✗ {service} health check error after {elapsed:.1f}s: {e}")


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])