import CurrentStockBalanceDashboard from '../../components/CurrentStockBalanceDashboard';
import { FeatureGate } from '../../components/FeatureGate';

export default function EmployeeCurrentStockPage() {
  return (
    <FeatureGate feature="INVENTORY_MANAGEMENT" fallback="locked">
      <CurrentStockBalanceDashboard />
    </FeatureGate>
  );
}
