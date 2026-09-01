import CurrentStockBalanceDashboard from '../../components/CurrentStockBalanceDashboard';
import { FeatureGate } from '../../components/FeatureGate';

export default function OwnerCurrentStockPage() {
  return (
    <FeatureGate feature="INVENTORY_MANAGEMENT" fallback="locked">
      <CurrentStockBalanceDashboard />
    </FeatureGate>
  );
}
