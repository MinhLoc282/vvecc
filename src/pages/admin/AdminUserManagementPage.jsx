import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Modal,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../hooks/use-auth-client";
import styles from "./index.module.css";

const AdminUserManagementPage = () => {
  const { getAdmins, addAdmin, removeAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle open modal
  const handleOpenModal = () => {
    setOpenModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setNewAdminAddress("");
  };

  const fetchAdmins = async () => {
    try {
      const adminAddresses = await getAdmins();
      setAdmins(
        adminAddresses.map((address, index) => ({ id: index, address }))
      );
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  // Add a new admin
  const handleAddAdmin = async () => {
    if (!newAdminAddress.trim()) return;

    try {
      setLoading(true);
      await addAdmin(newAdminAddress);
      fetchAdmins();
      handleCloseModal();
    } catch (error) {
      console.error("Error adding admin:", error);
    } finally {
      setLoading(false);
    }
  };

  // Remove an admin
  const handleRemoveAdmin = async (adminAddress) => {
    try {
      setLoading(true);
      await removeAdmin(adminAddress);
      fetchAdmins();
    } catch (error) {
      console.error("Error removing admin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <div className={styles.wrapContainer}>
      <div className={styles.container}>
        <div className={styles.wrapFirstContent}>
          <div className={styles.content}>
            <h1 className={styles.title}>Admin Management</h1>
          </div>
          <div className={styles.primaryButton} onClick={handleOpenModal}>
            Add Admin
          </div>

          {/* Add Admin Modal */}
          <Modal open={openModal} onClose={handleCloseModal}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                backgroundColor: "white",
                padding: 3,
                borderRadius: 2,
                boxShadow: 24,
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "rgb(0, 50, 99)", marginBottom: 2 }}
              >
                Add New Admin
              </Typography>
              <TextField
                label="Admin Wallet Address"
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  variant="outlined"
                  sx={{ color: "#236cb2", borderColor: "#236cb2" }}
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#236cb2",
                    "&:hover": { backgroundColor: "#1a4f8a" },
                  }}
                  onClick={handleAddAdmin}
                  disabled={!newAdminAddress.trim() || loading}
                >
                  {loading ? "Adding..." : "Add"}
                </Button>
              </Box>
            </Box>
          </Modal>
        </div>

        <div className={styles.wrapThirdContent}>
          <div className={styles.wrapTabContainer}>
            <div className={styles.wrapContent}>
              <div
                className={styles.loanContainer}
                component={Paper}
                sx={{ backgroundColor: "white" }}
              >
                <table className={styles.loanTable}>
                  <thead>
                    <tr>
                      <th
                        sx={{ fontWeight: "bold", color: "rgb(0, 50, 99)" }}
                      >
                        Admin Address
                      </th>
                      <th
                        sx={{ fontWeight: "bold", color: "rgb(0, 50, 99)" }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length > 0 ? (
                      admins.map((admin) => (
                        <tr key={admin.id}>
                          <td sx={{ color: "rgb(133, 134, 151)" }}>
                            {admin.address}
                          </td>
                          <td>
                            <Button
                              variant="outlined"
                              startIcon={<DeleteIcon />}
                              sx={{
                                color: "red",
                                borderColor: "red",
                                "&:hover": { borderColor: "darkred" },
                              }}
                              onClick={() => handleRemoveAdmin(admin.address)}
                              disabled={loading}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          sx={{ textAlign: "center", color: "gray" }}
                        >
                          No admins found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagementPage;
