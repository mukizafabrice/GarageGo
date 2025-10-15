import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  useTheme,
  Chip,
  List,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { axiosInstance } from '../../services/apiConfig';

const PRIMARY_COLOR = '#4CAF50';

const GarageReportsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  useEffect(() => {
    fetchReport();
  }, [selectedPeriod]);

  const fetchReport = async () => {
    if (!user?._id) {
      Alert.alert('Error', 'User ID not found. Please login again.');
      return;
    }

    try {
      setLoading(true);

      // First, get the garage by user ID
      const garageResponse = await axiosInstance.get(`/garages/user/${user._id}`);
      const garageData = garageResponse.data;

      if (!garageData.success || !garageData.data) {
        Alert.alert('Error', 'Garage not found for this user. Please contact support.');
        return;
      }

      const garageId = garageData.data._id;

      // Now fetch the report using the garage ID
      const response = await axiosInstance.get(`/reports/garage/${garageId}?period=${selectedPeriod}`);
      const data = response.data;

      if (data.success) {
        setReportData(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      Alert.alert('Error', 'Failed to load report. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SERVICE_COMPLETED': return '#4CAF50';
      case 'GARAGE_ACCEPTED': return '#2196F3';
      case 'GARAGE_DECLINED': return '#F44336';
      case 'SENT_SUCCESS': return '#FF9800';
      case 'DRIVER_CANCELED': return '#9C27B0';
      case 'EXPIRED': return '#607D8B';
      default: return '#757575';
    }
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && !reportData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ marginTop: 16, color: colors.onSurface }}>Loading Report...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_COLOR]} />
      }
    >
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Report Period</Text>
        <View style={styles.chipContainer}>
          {['daily', 'weekly', 'monthly'].map((period) => (
            <Chip
              key={period}
              selected={selectedPeriod === period}
              onPress={() => setSelectedPeriod(period)}
              style={[
                styles.chip,
                selectedPeriod === period && { backgroundColor: PRIMARY_COLOR }
              ]}
              textStyle={{
                color: selectedPeriod === period ? '#FFFFFF' : colors.onSurface
              }}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Chip>
          ))}
        </View>
      </View>

      {reportData && (
        <>
          {/* Garage Info */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                {reportData.garage.name}
              </Text>
              <Text style={{ color: colors.onSurfaceVariant }}>
                Owner: {reportData.garage.owner}
              </Text>
              <Text style={{ color: colors.onSurfaceVariant }}>
                Total Users: {reportData.garage.totalUsers}
              </Text>
            </Card.Content>
          </Card>

          {/* Statistics Cards */}
          <View style={styles.statsContainer}>
            <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.statNumber, { color: PRIMARY_COLOR }]}>
                  {reportData.statistics.totalRequests}
                </Text>
                <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                  Total Requests
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.statNumber, { color: '#2196F3' }]}>
                  {reportData.statistics.serviceCompleted}
                </Text>
                <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                  Services Completed
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                  {reportData.statistics.acceptanceRate}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                  Acceptance Rate
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                  {reportData.statistics.completionRate}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                  Completion Rate
                </Text>
              </Card.Content>
            </Card>
          </View>

          {/* Detailed Statistics */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Title title="Detailed Statistics" titleStyle={{ color: colors.onSurface }} />
            <Card.Content>
              <List.Item
                title="Sent Successfully"
                description={`${reportData.statistics.sentSuccess} notifications sent`}
                left={() => <List.Icon icon="send" color="#FF9800" />}
              />
              <Divider />
              <List.Item
                title="Garage Accepted"
                description={`${reportData.statistics.garageAccepted} requests accepted`}
                left={() => <List.Icon icon="check-circle" color="#2196F3" />}
              />
              <Divider />
              <List.Item
                title="Garage Declined"
                description={`${reportData.statistics.garageDeclined} requests declined`}
                left={() => <List.Icon icon="close-circle" color="#F44336" />}
              />
              <Divider />
              <List.Item
                title="Driver Canceled"
                description={`${reportData.statistics.driverCanceled} requests canceled by driver`}
                left={() => <List.Icon icon="cancel" color="#9C27B0" />}
              />
              <Divider />
              <List.Item
                title="Expired"
                description={`${reportData.statistics.expired} requests expired`}
                left={() => <List.Icon icon="timer-off" color="#607D8B" />}
              />
            </Card.Content>
          </Card>

          {/* Recent Activity */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Title title="Recent Activity" titleStyle={{ color: colors.onSurface }} />
            <Card.Content>
              {reportData.recentActivity.length > 0 ? (
                reportData.recentActivity.map((activity, index) => (
                  <View key={activity.id}>
                    <List.Item
                      title={activity.driverName}
                      description={`${activity.driverPhone} • ${formatDate(activity.timestamp)}`}
                      left={() => (
                        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(activity.status) }]} />
                      )}
                      right={() => (
                        <Chip
                          style={{ backgroundColor: getStatusColor(activity.status) }}
                          textStyle={{ color: '#FFFFFF', fontSize: 10 }}
                        >
                          {formatStatus(activity.status)}
                        </Chip>
                      )}
                    />
                    {index < reportData.recentActivity.length - 1 && <Divider />}
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.onSurfaceVariant, textAlign: 'center', padding: 16 }}>
                  No recent activity for this period
                </Text>
              )}
            </Card.Content>
          </Card>
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chip: {
    flex: 1,
    marginHorizontal: 4,
  },
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignSelf: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});

export default GarageReportsScreen;