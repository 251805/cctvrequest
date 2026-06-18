/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PFRFData {
  requesterName: string;
  date: string;
  designation: string;
  requestNo: string;
  playbackReasons: string[];
  playbackReasonOther?: string;
  incidentDate: string;
  incidentTime: string;
  location: string;
  locationOther?: string;
  landmark: string;
  vehiclesInvolved: string[];
  vehicleOther?: string;
  vehicleDescription?: string;
  incidentDescription: string;
  status: string;
  operatorRemarks: string;
  attendedBy: string;
  attendedDate: string;
  supervisorName: string;
  supervisorDate: string;
  approvedBy: string;
}
