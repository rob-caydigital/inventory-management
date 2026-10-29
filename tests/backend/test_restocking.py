"""
Tests for restocking API endpoints.
"""
from datetime import date, timedelta

import pytest

import main


@pytest.fixture(autouse=True)
def reset_restock_orders():
    """Clear in-memory restocking orders so each test starts empty."""
    main.restock_orders.clear()
    yield
    main.restock_orders.clear()


class TestRestockingEndpoints:
    """Test suite for restocking-related endpoints."""

    def test_demand_forecast_includes_pricing(self, client):
        """Test that forecasts carry unit cost and lead time for budgeting."""
        response = client.get("/api/demand")
        assert response.status_code == 200

        for forecast in response.json():
            assert isinstance(forecast["unit_cost"], (int, float))
            assert isinstance(forecast["lead_time_days"], int)
            assert forecast["unit_cost"] > 0
            assert forecast["lead_time_days"] > 0

    def test_get_restock_orders_empty(self, client):
        """Test that no restocking orders exist initially."""
        response = client.get("/api/restocking-orders")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_restock_order(self, client):
        """Test submitting a restocking order prices items server-side."""
        forecasts = {f["item_sku"]: f for f in client.get("/api/demand").json()}
        payload = {"items": [{"sku": "WDG-001", "quantity": 10}, {"sku": "GSK-203", "quantity": 4}]}

        response = client.post("/api/restocking-orders", json=payload)
        assert response.status_code == 201

        order = response.json()
        assert order["order_number"] == "RST-0001"
        assert order["status"] == "Submitted"
        assert len(order["items"]) == 2

        expected_total = 10 * forecasts["WDG-001"]["unit_cost"] + 4 * forecasts["GSK-203"]["unit_cost"]
        assert abs(order["total_value"] - expected_total) < 0.01

    def test_restock_order_lead_time_calculation(self, client):
        """Test that lead time is the slowest item and drives expected delivery."""
        forecasts = {f["item_sku"]: f for f in client.get("/api/demand").json()}
        payload = {"items": [{"sku": "WDG-001", "quantity": 1}, {"sku": "MTR-304", "quantity": 1}]}

        order = client.post("/api/restocking-orders", json=payload).json()

        expected_lead = max(forecasts["WDG-001"]["lead_time_days"], forecasts["MTR-304"]["lead_time_days"])
        assert order["lead_time_days"] == expected_lead
        assert order["submitted_date"] == date.today().isoformat()
        assert order["expected_delivery"] == (date.today() + timedelta(days=expected_lead)).isoformat()

    def test_get_restock_orders_newest_first(self, client):
        """Test that submitted orders are listed newest first."""
        client.post("/api/restocking-orders", json={"items": [{"sku": "WDG-001", "quantity": 1}]})
        client.post("/api/restocking-orders", json={"items": [{"sku": "BRG-102", "quantity": 1}]})

        data = client.get("/api/restocking-orders").json()
        assert [o["order_number"] for o in data] == ["RST-0002", "RST-0001"]

    def test_create_restock_order_empty_items(self, client):
        """Test that an order with no items is rejected."""
        response = client.post("/api/restocking-orders", json={"items": []})
        assert response.status_code == 400
        assert "detail" in response.json()

    def test_create_restock_order_unknown_sku(self, client):
        """Test that an unknown SKU is rejected."""
        response = client.post("/api/restocking-orders", json={"items": [{"sku": "NOPE-999", "quantity": 1}]})
        assert response.status_code == 400
        assert "NOPE-999" in response.json()["detail"]

    @pytest.mark.parametrize("quantity", [0, -5])
    def test_create_restock_order_invalid_quantity(self, client, quantity):
        """Test that zero or negative quantities are rejected."""
        response = client.post("/api/restocking-orders", json={"items": [{"sku": "WDG-001", "quantity": quantity}]})
        assert response.status_code == 400

    def test_create_restock_order_over_budget(self, client):
        """Test that an order exceeding the budget is rejected and not stored."""
        payload = {"items": [{"sku": "MTR-304", "quantity": 100}], "budget": 100}
        response = client.post("/api/restocking-orders", json=payload)
        assert response.status_code == 400
        assert "budget" in response.json()["detail"].lower()

        assert client.get("/api/restocking-orders").json() == []
