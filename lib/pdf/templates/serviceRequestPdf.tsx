// lib/pdf/templates/serviceRequestPdf.tsx
import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import dayjs from "dayjs";

const safe = (v: any, fb = "—") => {
  if (!v) return fb;
  return v;
};

// Tesla-inspired minimalist styling
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
  },

  sectionTitle: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "bold",
    color: "#0A0A0A",
  },

  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  label: {
    color: "#7A7A7A",
    fontSize: 10,
  },
  value: {
    fontSize: 11,
    fontWeight: 500,
    color: "#0A0A0A",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 10,
  },

  noteBlock: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },

  noteHeader: {
    fontSize: 10,
    color: "#7A7A7A",
  },
  noteText: {
    marginTop: 3,
    fontSize: 11,
  },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  photo: {
    width: 130,
    height: 130,
    objectFit: "cover",
    borderRadius: 6,
  },
});

/** PDF Layout composed into a React-PDF Document */
export function ServiceRequestPdf({ data }: { data: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>
            Revlet Fleet — Service Request
          </Text>
          <Text style={{ color: "#7A7A7A", fontSize: 11 }}>
            Request ID: {data.id}
          </Text>
        </View>

        {/* REQUEST SUMMARY */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Request Summary</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{safe(data.status)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Created</Text>
            <Text style={styles.value}>{safe(data.created_at)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Scheduled</Text>
            <Text style={styles.value}>{safe(data.scheduled_at)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Last Updated</Text>
            <Text style={styles.value}>{safe(data.updated_at)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>PO Number</Text>
            <Text style={styles.value}>{safe(data.po_number)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Mileage</Text>
            <Text style={styles.value}>{safe(data.mileage)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>FMC</Text>
            <Text style={styles.value}>{safe(data.fmc)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>FMC Text</Text>
            <Text style={styles.value}>{safe(data.fmc_text)}</Text>
          </View>
        </View>

        {/* CUSTOMER + VEHICLE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer + Vehicle</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{safe(data.customer?.name)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{safe(data.location?.name)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Unit</Text>
            <Text style={styles.value}>{safe(data.vehicle?.unit_number)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Plate</Text>
            <Text style={styles.value}>{safe(data.vehicle?.plate)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Year/Make/Model</Text>
            <Text style={styles.value}>
              {safe(
                `${data.vehicle?.year ?? ""} ${data.vehicle?.make ?? ""} ${
                  data.vehicle?.model ?? ""
                }`
              )}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>VIN</Text>
            <Text style={styles.value}>{safe(data.vehicle?.vin)}</Text>
          </View>
        </View>

        {/* TECHNICIAN */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Technician</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Assigned Technician</Text>
            <Text style={styles.value}>{safe(data.technician?.name)}</Text>
          </View>
        </View>

        {/* CONCERN */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Concern</Text>
          <Text style={{ fontSize: 11 }}>{safe(data.concern)}</Text>
        </View>

        {/* NOTES TIMELINE */}
        {data.notes?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>

            {data.notes.map((n: any) => (
              <View key={n.id} style={styles.noteBlock}>
                <Text style={styles.noteHeader}>
                  {n.created_at} — {n.author?.name} ({n.author?.email})
                </Text>
                <Text style={styles.noteText}>{n.body}</Text>
              </View>
            ))}
          </View>
        )}

        {/* PHOTOS */}
        {data.photos?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Photos</Text>

            <View style={styles.photoGrid}>
              {data.photos.map((p: any) => (
                <Image key={p.id} style={styles.photo} src={p.public_url} />
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
