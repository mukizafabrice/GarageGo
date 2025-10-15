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
  ProgressBar,
} from 'react-native-paper';
import { axiosInstance } from '../../services/apiConfig';

const PRIMARY_COLOR = '#4CAF50';

const AdminReportsScreen = ({ navigation }) => {
  const { colors } = useTheme();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  useEffect(() => {
    fetchReport();
  }, [selectedPeriod]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/reports/admin/system?period=${selectedPeriod}`);
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

  if (loading && !reportData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ marginTop: 16, color: colors.onSurface }}>Loading System Report...</Text>
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
          {/* System Overview */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Title title="System Overview" titleStyle={{ color: colors.onSurface }} />
            <Card.Content>
              <View style={styles.overviewGrid}>
                <View style={styles.overviewItem}>
                  <Text style={[styles.overviewNumber, { color: PRIMARY_COLOR }]}>
                    {reportData.systemOverview.totalUsers}
                  </Text>
                  <Text style={[styles.overviewLabel, { color: colors.onSurface }]}>
                    Total Users
                  </Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={[styles.overviewNumber, { color: '#2196F3' }]}>
                    {reportData.systemOverview.totalGarages}
                  </Text>
                  <Text style={[styles.overviewLabel, { color: colors.onSurface }]}>
                    Total Garages
                  </Text>
                </View>
                <View style={styles.overviewItem}>
                  <Text style={[styles.overviewNumber, { color: '#FF9800' }]}>
                    {reportData.systemOverview.totalNotifications}
                  </Text>
                  <Text style={[styles.overviewLabel, { color: colors.onSurface }]}>
                    Total Notifications
                  </Text>
                </View>
              </View>

              <Divider style={{ marginVertical: 16 }} />

              <Text style={[styles.subsectionTitle, { color: colors.onSurface }]}>User Breakdown</Text>
              <List.Item
                title="Administrators"
                description={`${reportData.systemOverview.userBreakdown.admins} users`}
                left={() => <List.Icon icon="shield-account" color="#F44336" />}
              />
              <List.Item
                title="Garage Owners"
                description={`${reportData.systemOverview.userBreakdown.garageOwners} users`}
                left={() => <List.Icon icon="car-wrench" color="#2196F3" />}
              />
              <List.Item
                title="Staff Users"
                description={`${reportData.systemOverview.userBreakdown.staffUsers} users`}
                left={() => <List.Icon icon="account-multiple" color="#4CAF50" />}
              />
            </Card.Content>
          </Card>

          {/* System Health */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Title title="System Health" titleStyle={{ color: colors.onSurface }} />
            <Card.Content>
              <View style={styles.healthItem}>
                <View style={styles.healthText}>
                  <Text style={{ color: colors.onSurface }}>Success Rate</Text>
                  <Text style={[styles.healthValue, { color: '#4CAF50' }]}>
                    {reportData.systemHealth.successRate}%
                  </Text>
                </View>
                <ProgressBar
                  progress={parseFloat(reportData.systemHealth.successRate) / 100}
                  color="#4CAF50"
                  style={styles.progressBar}
                />
              </View>

              <View style={styles.healthItem}>
                <View style={styles.healthText}>
                  <Text style={{ color: colors.onSurface }}>Error Rate</Text>
                  <Text style={[styles.healthValue, { color: '#F44336' }]}>
                    {reportData.systemHealth.errorRate}%
                  </Text>
                </View>
                <ProgressBar
                  progress={parseFloat(reportData.systemHealth.errorRate) / 100}
                  color="#F44336"
                  style={styles.progressBar}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Notification Statistics */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Title title="Notification Statistics" titleStyle={{ color: colors.onSurface }} />
            <Card.Content>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                    {reportData.notificationStatistics.sentSuccess}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                    Sent Success
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#2196F3' }]}>
                    {reportData.notificationStatistics.garageAccepted}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                    Accepted
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                    {reportData.notificationStatistics.serviceCompleted}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                    Completed
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#F44336' }]}>
                    {reportData.notificationStatistics.garageDeclined}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.onSurface }]}>
                    Declined
                  </Text>
                </View>
              </View>

              <Divider style={{ marginVertical: 16 }} />

              <View style={styles.rateContainer}>
                <View style={styles.rateItem}>
                  <Text style={[styles.rateLabel, { color: colors.onSurface }]}>Acceptance Rate</Text>
                  <Text style={[styles.rateValue, { color: '#FF9800' }]}>
                    {reportData.notificationStatistics.acceptanceRate}%
                  </Text>
                </View>
                <View style={styles.rateItem}>
                  <Text style={[styles.rateLabel, { color: colors.onSurface }]}>Completion Rate</Text>
                  <Text style={[styles.rateValue, { color: '#4CAF50' }]}>
                    {reportData.notificationStatistics.completionRate}%
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Top Performing Garages */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Title title="Top Performing Garages" titleStyle={{ color: colors.onSurface }} />
            <Card.Content>
              {reportData.topPerformingGarages.length > 0 ? (
                reportData.topPerformingGarages.map((garage, index) => (
                  <View key={index}>
                    <List.Item
                      title={`${index + 1}. ${garage.name}`}
                      description={`${garage.completedServices} services completed`}
                      left={() => (
                        <View style={[styles.rankBadge, { backgroundColor: PRIMARY_COLOR }]}>
                          <Text style={styles.rankText}>{index + 1}</Text>
                        </View>
                      )}
                    />
                    {index < reportData.topPerformingGarages.length - 1 && <Divider />}
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.onSurfaceVariant, textAlign: 'center', padding: 16 }}>
                  No completed services for this period
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Error Statistics */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Title title="Error Statistics" titleStyle={{ color: colors.onSurface }} />
            <Card.Content>
              <List.Item
                title="No Garage Found"
                description={`${reportData.notificationStatistics.noGarageFound} requests`}
                left={() => <List.Icon icon="map-marker-off" color="#F44336" />}
              />
              <Divider />
              <List.Item
                title="Invalid Token"
                description={`${reportData.notificationStatistics.invalidToken} requests`}
                left={() => <List.Icon icon="cellphone-off" color="#FF9800" />}
              />
              <Divider />
              <List.Item
                title="Send Failed"
                description={`${reportData.notificationStatistics.sendFailed} requests`}
                left={() => <List.Icon icon="send-off" color="#F44336" />}
              />
              <Divider />
              <List.Item
                title="Server Error"
                description={`${reportData.notificationStatistics.serverError} requests`}
                left={() => <List.Icon icon="server-off" color="#9C27B0" />}
              />
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
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  healthItem: {
    marginBottom: 16,
  },
  healthText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  healthValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    margin: '1%',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  rateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rateItem: {
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});

export default AdminReportsScreen;