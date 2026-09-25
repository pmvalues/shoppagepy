package handlers

import (
	"encoding/json"
	"fmt"
)

// MarshalSnapshot serialises the complete workspace state for persistence.
func (s *MerchantStoreState) MarshalSnapshot() ([]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return json.Marshal(s)
}

// RestoreSnapshot replaces workspace state with a stored snapshot. Fields
// absent from the snapshot (added in a newer release) keep their defaults.
func (s *MerchantStoreState) RestoreSnapshot(data []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := json.Unmarshal(data, s); err != nil {
		return fmt.Errorf("restore workspace snapshot: %w", err)
	}
	return nil
}

// TenantID is the key the workspace is persisted under.
func (s *MerchantStoreState) TenantID() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.Store.ID
}
