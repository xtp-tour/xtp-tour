// Code generated by BobGen mysql v0.31.0. DO NOT EDIT.
// This file is meant to be re-generated in place and/or deleted at any time.

package models

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"

	"github.com/aarondl/opt/null"
	"github.com/aarondl/opt/omit"
	"github.com/aarondl/opt/omitnull"
	"github.com/stephenafamo/bob"
	"github.com/stephenafamo/bob/dialect/mysql"
	"github.com/stephenafamo/bob/dialect/mysql/dialect"
	"github.com/stephenafamo/bob/dialect/mysql/dm"
	"github.com/stephenafamo/bob/dialect/mysql/sm"
	"github.com/stephenafamo/bob/dialect/mysql/um"
	"github.com/stephenafamo/bob/expr"
	"github.com/stephenafamo/bob/mods"
	"github.com/stephenafamo/bob/orm"
)

// CourtGroup is an object representing the database table.
type CourtGroup struct {
	ID              int32              `db:"id,pk,autoincr" `
	FacilityID      string             `db:"facility_id" `
	Surface         CourtGroupsSurface `db:"surface" `
	Type            CourtGroupsType    `db:"type" `
	Light           null.Val[bool]     `db:"light" `
	Heating         null.Val[bool]     `db:"heating" `
	ReservationLink null.Val[string]   `db:"reservation_link" `
	CourtNames      null.Val[string]   `db:"court_names" `

	R courtGroupR `db:"-" `
}

// CourtGroupSlice is an alias for a slice of pointers to CourtGroup.
// This should almost always be used instead of []*CourtGroup.
type CourtGroupSlice []*CourtGroup

// CourtGroups contains methods to work with the court_groups table
var CourtGroups = mysql.NewTablex[*CourtGroup, CourtGroupSlice, *CourtGroupSetter]("court_groups", []string{"id"})

// CourtGroupsQuery is a query on the court_groups table
type CourtGroupsQuery = *mysql.ViewQuery[*CourtGroup, CourtGroupSlice]

// courtGroupR is where relationships are stored.
type courtGroupR struct {
	Facility     *Facility        // court_groups_ibfk_1
	PricePeriods PricePeriodSlice // price_periods_ibfk_1
}

type courtGroupColumnNames struct {
	ID              string
	FacilityID      string
	Surface         string
	Type            string
	Light           string
	Heating         string
	ReservationLink string
	CourtNames      string
}

var CourtGroupColumns = buildCourtGroupColumns("court_groups")

type courtGroupColumns struct {
	tableAlias      string
	ID              mysql.Expression
	FacilityID      mysql.Expression
	Surface         mysql.Expression
	Type            mysql.Expression
	Light           mysql.Expression
	Heating         mysql.Expression
	ReservationLink mysql.Expression
	CourtNames      mysql.Expression
}

func (c courtGroupColumns) Alias() string {
	return c.tableAlias
}

func (courtGroupColumns) AliasedAs(alias string) courtGroupColumns {
	return buildCourtGroupColumns(alias)
}

func buildCourtGroupColumns(alias string) courtGroupColumns {
	return courtGroupColumns{
		tableAlias:      alias,
		ID:              mysql.Quote(alias, "id"),
		FacilityID:      mysql.Quote(alias, "facility_id"),
		Surface:         mysql.Quote(alias, "surface"),
		Type:            mysql.Quote(alias, "type"),
		Light:           mysql.Quote(alias, "light"),
		Heating:         mysql.Quote(alias, "heating"),
		ReservationLink: mysql.Quote(alias, "reservation_link"),
		CourtNames:      mysql.Quote(alias, "court_names"),
	}
}

type courtGroupWhere[Q mysql.Filterable] struct {
	ID              mysql.WhereMod[Q, int32]
	FacilityID      mysql.WhereMod[Q, string]
	Surface         mysql.WhereMod[Q, CourtGroupsSurface]
	Type            mysql.WhereMod[Q, CourtGroupsType]
	Light           mysql.WhereNullMod[Q, bool]
	Heating         mysql.WhereNullMod[Q, bool]
	ReservationLink mysql.WhereNullMod[Q, string]
	CourtNames      mysql.WhereNullMod[Q, string]
}

func (courtGroupWhere[Q]) AliasedAs(alias string) courtGroupWhere[Q] {
	return buildCourtGroupWhere[Q](buildCourtGroupColumns(alias))
}

func buildCourtGroupWhere[Q mysql.Filterable](cols courtGroupColumns) courtGroupWhere[Q] {
	return courtGroupWhere[Q]{
		ID:              mysql.Where[Q, int32](cols.ID),
		FacilityID:      mysql.Where[Q, string](cols.FacilityID),
		Surface:         mysql.Where[Q, CourtGroupsSurface](cols.Surface),
		Type:            mysql.Where[Q, CourtGroupsType](cols.Type),
		Light:           mysql.WhereNull[Q, bool](cols.Light),
		Heating:         mysql.WhereNull[Q, bool](cols.Heating),
		ReservationLink: mysql.WhereNull[Q, string](cols.ReservationLink),
		CourtNames:      mysql.WhereNull[Q, string](cols.CourtNames),
	}
}

var CourtGroupErrors = &courtGroupErrors{
	ErrUniquePrimary: &UniqueConstraintError{s: "PRIMARY"},
}

type courtGroupErrors struct {
	ErrUniquePrimary *UniqueConstraintError
}

// CourtGroupSetter is used for insert/upsert/update operations
// All values are optional, and do not have to be set
// Generated columns are not included
type CourtGroupSetter struct {
	ID              omit.Val[int32]              `db:"id,pk,autoincr" `
	FacilityID      omit.Val[string]             `db:"facility_id" `
	Surface         omit.Val[CourtGroupsSurface] `db:"surface" `
	Type            omit.Val[CourtGroupsType]    `db:"type" `
	Light           omitnull.Val[bool]           `db:"light" `
	Heating         omitnull.Val[bool]           `db:"heating" `
	ReservationLink omitnull.Val[string]         `db:"reservation_link" `
	CourtNames      omitnull.Val[string]         `db:"court_names" `
}

func (s CourtGroupSetter) SetColumns() []string {
	vals := make([]string, 0, 8)
	if !s.ID.IsUnset() {
		vals = append(vals, "id")
	}

	if !s.FacilityID.IsUnset() {
		vals = append(vals, "facility_id")
	}

	if !s.Surface.IsUnset() {
		vals = append(vals, "surface")
	}

	if !s.Type.IsUnset() {
		vals = append(vals, "type")
	}

	if !s.Light.IsUnset() {
		vals = append(vals, "light")
	}

	if !s.Heating.IsUnset() {
		vals = append(vals, "heating")
	}

	if !s.ReservationLink.IsUnset() {
		vals = append(vals, "reservation_link")
	}

	if !s.CourtNames.IsUnset() {
		vals = append(vals, "court_names")
	}

	return vals
}

func (s CourtGroupSetter) Overwrite(t *CourtGroup) {
	if !s.ID.IsUnset() {
		t.ID, _ = s.ID.Get()
	}
	if !s.FacilityID.IsUnset() {
		t.FacilityID, _ = s.FacilityID.Get()
	}
	if !s.Surface.IsUnset() {
		t.Surface, _ = s.Surface.Get()
	}
	if !s.Type.IsUnset() {
		t.Type, _ = s.Type.Get()
	}
	if !s.Light.IsUnset() {
		t.Light, _ = s.Light.GetNull()
	}
	if !s.Heating.IsUnset() {
		t.Heating, _ = s.Heating.GetNull()
	}
	if !s.ReservationLink.IsUnset() {
		t.ReservationLink, _ = s.ReservationLink.GetNull()
	}
	if !s.CourtNames.IsUnset() {
		t.CourtNames, _ = s.CourtNames.GetNull()
	}
}

func (s *CourtGroupSetter) Apply(q *dialect.InsertQuery) {
	q.AppendHooks(func(ctx context.Context, exec bob.Executor) (context.Context, error) {
		return CourtGroups.BeforeInsertHooks.RunHooks(ctx, exec, s)
	})

	q.AppendValues(bob.ExpressionFunc(func(ctx context.Context, w io.Writer, d bob.Dialect, start int) ([]any, error) {
		vals := make([]bob.Expression, 8)
		if s.ID.IsUnset() {
			vals[0] = mysql.Raw("DEFAULT")
		} else {
			vals[0] = mysql.Arg(s.ID)
		}

		if s.FacilityID.IsUnset() {
			vals[1] = mysql.Raw("DEFAULT")
		} else {
			vals[1] = mysql.Arg(s.FacilityID)
		}

		if s.Surface.IsUnset() {
			vals[2] = mysql.Raw("DEFAULT")
		} else {
			vals[2] = mysql.Arg(s.Surface)
		}

		if s.Type.IsUnset() {
			vals[3] = mysql.Raw("DEFAULT")
		} else {
			vals[3] = mysql.Arg(s.Type)
		}

		if s.Light.IsUnset() {
			vals[4] = mysql.Raw("DEFAULT")
		} else {
			vals[4] = mysql.Arg(s.Light)
		}

		if s.Heating.IsUnset() {
			vals[5] = mysql.Raw("DEFAULT")
		} else {
			vals[5] = mysql.Arg(s.Heating)
		}

		if s.ReservationLink.IsUnset() {
			vals[6] = mysql.Raw("DEFAULT")
		} else {
			vals[6] = mysql.Arg(s.ReservationLink)
		}

		if s.CourtNames.IsUnset() {
			vals[7] = mysql.Raw("DEFAULT")
		} else {
			vals[7] = mysql.Arg(s.CourtNames)
		}

		return bob.ExpressSlice(ctx, w, d, start, vals, "", ", ", "")
	}))
}

func (s CourtGroupSetter) UpdateMod() bob.Mod[*dialect.UpdateQuery] {
	return um.Set(s.Expressions("court_groups")...)
}

func (s CourtGroupSetter) Expressions(prefix ...string) []bob.Expression {
	exprs := make([]bob.Expression, 0, 8)

	if !s.ID.IsUnset() {
		exprs = append(exprs, expr.Join{Sep: " = ", Exprs: []bob.Expression{
			mysql.Quote(append(prefix, "id")...),
			mysql.Arg(s.ID),
		}})
	}

	if !s.FacilityID.IsUnset() {
		exprs = append(exprs, expr.Join{Sep: " = ", Exprs: []bob.Expression{
			mysql.Quote(append(prefix, "facility_id")...),
			mysql.Arg(s.FacilityID),
		}})
	}

	if !s.Surface.IsUnset() {
		exprs = append(exprs, expr.Join{Sep: " = ", Exprs: []bob.Expression{
			mysql.Quote(append(prefix, "surface")...),
			mysql.Arg(s.Surface),
		}})
	}

	if !s.Type.IsUnset() {
		exprs = append(exprs, expr.Join{Sep: " = ", Exprs: []bob.Expression{
			mysql.Quote(append(prefix, "type")...),
			mysql.Arg(s.Type),
		}})
	}

	if !s.Light.IsUnset() {
		exprs = append(exprs, expr.Join{Sep: " = ", Exprs: []bob.Expression{
			mysql.Quote(append(prefix, "light")...),
			mysql.Arg(s.Light),
		}})
	}

	if !s.Heating.IsUnset() {
		exprs = append(exprs, expr.Join{Sep: " = ", Exprs: []bob.Expression{
			mysql.Quote(append(prefix, "heating")...),
			mysql.Arg(s.Heating),
		}})
	}

	if !s.ReservationLink.IsUnset() {
		exprs = append(exprs, expr.Join{Sep: " = ", Exprs: []bob.Expression{
			mysql.Quote(append(prefix, "reservation_link")...),
			mysql.Arg(s.ReservationLink),
		}})
	}

	if !s.CourtNames.IsUnset() {
		exprs = append(exprs, expr.Join{Sep: " = ", Exprs: []bob.Expression{
			mysql.Quote(append(prefix, "court_names")...),
			mysql.Arg(s.CourtNames),
		}})
	}

	return exprs
}

// FindCourtGroup retrieves a single record by primary key
// If cols is empty Find will return all columns.
func FindCourtGroup(ctx context.Context, exec bob.Executor, IDPK int32, cols ...string) (*CourtGroup, error) {
	if len(cols) == 0 {
		return CourtGroups.Query(
			SelectWhere.CourtGroups.ID.EQ(IDPK),
		).One(ctx, exec)
	}

	return CourtGroups.Query(
		SelectWhere.CourtGroups.ID.EQ(IDPK),
		sm.Columns(CourtGroups.Columns().Only(cols...)),
	).One(ctx, exec)
}

// CourtGroupExists checks the presence of a single record by primary key
func CourtGroupExists(ctx context.Context, exec bob.Executor, IDPK int32) (bool, error) {
	return CourtGroups.Query(
		SelectWhere.CourtGroups.ID.EQ(IDPK),
	).Exists(ctx, exec)
}

// AfterQueryHook is called after CourtGroup is retrieved from the database
func (o *CourtGroup) AfterQueryHook(ctx context.Context, exec bob.Executor, queryType bob.QueryType) error {
	var err error

	switch queryType {
	case bob.QueryTypeSelect:
		ctx, err = CourtGroups.AfterSelectHooks.RunHooks(ctx, exec, CourtGroupSlice{o})
	case bob.QueryTypeInsert:
		ctx, err = CourtGroups.AfterInsertHooks.RunHooks(ctx, exec, CourtGroupSlice{o})
	case bob.QueryTypeUpdate:
		ctx, err = CourtGroups.AfterUpdateHooks.RunHooks(ctx, exec, CourtGroupSlice{o})
	case bob.QueryTypeDelete:
		ctx, err = CourtGroups.AfterDeleteHooks.RunHooks(ctx, exec, CourtGroupSlice{o})
	}

	return err
}

// PrimaryKeyVals returns the primary key values of the CourtGroup
func (o *CourtGroup) PrimaryKeyVals() bob.Expression {
	return mysql.Arg(o.ID)
}

func (o *CourtGroup) pkEQ() dialect.Expression {
	return mysql.Quote("court_groups", "id").EQ(bob.ExpressionFunc(func(ctx context.Context, w io.Writer, d bob.Dialect, start int) ([]any, error) {
		return o.PrimaryKeyVals().WriteSQL(ctx, w, d, start)
	}))
}

// Update uses an executor to update the CourtGroup
func (o *CourtGroup) Update(ctx context.Context, exec bob.Executor, s *CourtGroupSetter) error {
	_, err := CourtGroups.Update(s.UpdateMod(), um.Where(o.pkEQ())).Exec(ctx, exec)
	if err != nil {
		return err
	}

	s.Overwrite(o)

	return nil
}

// Delete deletes a single CourtGroup record with an executor
func (o *CourtGroup) Delete(ctx context.Context, exec bob.Executor) error {
	_, err := CourtGroups.Delete(dm.Where(o.pkEQ())).Exec(ctx, exec)
	return err
}

// Reload refreshes the CourtGroup using the executor
func (o *CourtGroup) Reload(ctx context.Context, exec bob.Executor) error {
	o2, err := CourtGroups.Query(
		SelectWhere.CourtGroups.ID.EQ(o.ID),
	).One(ctx, exec)
	if err != nil {
		return err
	}
	o2.R = o.R
	*o = *o2

	return nil
}

// AfterQueryHook is called after CourtGroupSlice is retrieved from the database
func (o CourtGroupSlice) AfterQueryHook(ctx context.Context, exec bob.Executor, queryType bob.QueryType) error {
	var err error

	switch queryType {
	case bob.QueryTypeSelect:
		ctx, err = CourtGroups.AfterSelectHooks.RunHooks(ctx, exec, o)
	case bob.QueryTypeInsert:
		ctx, err = CourtGroups.AfterInsertHooks.RunHooks(ctx, exec, o)
	case bob.QueryTypeUpdate:
		ctx, err = CourtGroups.AfterUpdateHooks.RunHooks(ctx, exec, o)
	case bob.QueryTypeDelete:
		ctx, err = CourtGroups.AfterDeleteHooks.RunHooks(ctx, exec, o)
	}

	return err
}

func (o CourtGroupSlice) pkIN() dialect.Expression {
	if len(o) == 0 {
		return mysql.Raw("NULL")
	}

	return mysql.Quote("court_groups", "id").In(bob.ExpressionFunc(func(ctx context.Context, w io.Writer, d bob.Dialect, start int) ([]any, error) {
		pkPairs := make([]bob.Expression, len(o))
		for i, row := range o {
			pkPairs[i] = row.PrimaryKeyVals()
		}
		return bob.ExpressSlice(ctx, w, d, start, pkPairs, "", ", ", "")
	}))
}

// copyMatchingRows finds models in the given slice that have the same primary key
// then it first copies the existing relationships from the old model to the new model
// and then replaces the old model in the slice with the new model
func (o CourtGroupSlice) copyMatchingRows(from ...*CourtGroup) {
	for i, old := range o {
		for _, new := range from {
			if new.ID != old.ID {
				continue
			}
			new.R = old.R
			o[i] = new
			break
		}
	}
}

// UpdateMod modifies an update query with "WHERE primary_key IN (o...)"
func (o CourtGroupSlice) UpdateMod() bob.Mod[*dialect.UpdateQuery] {
	return bob.ModFunc[*dialect.UpdateQuery](func(q *dialect.UpdateQuery) {
		q.AppendHooks(func(ctx context.Context, exec bob.Executor) (context.Context, error) {
			return CourtGroups.BeforeUpdateHooks.RunHooks(ctx, exec, o)
		})

		q.AppendLoader(bob.LoaderFunc(func(ctx context.Context, exec bob.Executor, retrieved any) error {
			var err error
			switch retrieved := retrieved.(type) {
			case *CourtGroup:
				o.copyMatchingRows(retrieved)
			case []*CourtGroup:
				o.copyMatchingRows(retrieved...)
			case CourtGroupSlice:
				o.copyMatchingRows(retrieved...)
			default:
				// If the retrieved value is not a CourtGroup or a slice of CourtGroup
				// then run the AfterUpdateHooks on the slice
				_, err = CourtGroups.AfterUpdateHooks.RunHooks(ctx, exec, o)
			}

			return err
		}))

		q.AppendWhere(o.pkIN())
	})
}

// DeleteMod modifies an delete query with "WHERE primary_key IN (o...)"
func (o CourtGroupSlice) DeleteMod() bob.Mod[*dialect.DeleteQuery] {
	return bob.ModFunc[*dialect.DeleteQuery](func(q *dialect.DeleteQuery) {
		q.AppendHooks(func(ctx context.Context, exec bob.Executor) (context.Context, error) {
			return CourtGroups.BeforeDeleteHooks.RunHooks(ctx, exec, o)
		})

		q.AppendLoader(bob.LoaderFunc(func(ctx context.Context, exec bob.Executor, retrieved any) error {
			var err error
			switch retrieved := retrieved.(type) {
			case *CourtGroup:
				o.copyMatchingRows(retrieved)
			case []*CourtGroup:
				o.copyMatchingRows(retrieved...)
			case CourtGroupSlice:
				o.copyMatchingRows(retrieved...)
			default:
				// If the retrieved value is not a CourtGroup or a slice of CourtGroup
				// then run the AfterDeleteHooks on the slice
				_, err = CourtGroups.AfterDeleteHooks.RunHooks(ctx, exec, o)
			}

			return err
		}))

		q.AppendWhere(o.pkIN())
	})
}

func (o CourtGroupSlice) UpdateAll(ctx context.Context, exec bob.Executor, vals CourtGroupSetter) error {
	_, err := CourtGroups.Update(vals.UpdateMod(), o.UpdateMod()).Exec(ctx, exec)

	for i := range o {
		vals.Overwrite(o[i])
	}

	return err
}

func (o CourtGroupSlice) DeleteAll(ctx context.Context, exec bob.Executor) error {
	if len(o) == 0 {
		return nil
	}

	_, err := CourtGroups.Delete(o.DeleteMod()).Exec(ctx, exec)
	return err
}

func (o CourtGroupSlice) ReloadAll(ctx context.Context, exec bob.Executor) error {
	if len(o) == 0 {
		return nil
	}

	o2, err := CourtGroups.Query(sm.Where(o.pkIN())).All(ctx, exec)
	if err != nil {
		return err
	}

	o.copyMatchingRows(o2...)

	return nil
}

type courtGroupJoins[Q dialect.Joinable] struct {
	typ          string
	Facility     func(context.Context) modAs[Q, facilityColumns]
	PricePeriods func(context.Context) modAs[Q, pricePeriodColumns]
}

func (j courtGroupJoins[Q]) aliasedAs(alias string) courtGroupJoins[Q] {
	return buildCourtGroupJoins[Q](buildCourtGroupColumns(alias), j.typ)
}

func buildCourtGroupJoins[Q dialect.Joinable](cols courtGroupColumns, typ string) courtGroupJoins[Q] {
	return courtGroupJoins[Q]{
		typ:          typ,
		Facility:     courtGroupsJoinFacility[Q](cols, typ),
		PricePeriods: courtGroupsJoinPricePeriods[Q](cols, typ),
	}
}

func courtGroupsJoinFacility[Q dialect.Joinable](from courtGroupColumns, typ string) func(context.Context) modAs[Q, facilityColumns] {
	return func(ctx context.Context) modAs[Q, facilityColumns] {
		return modAs[Q, facilityColumns]{
			c: FacilityColumns,
			f: func(to facilityColumns) bob.Mod[Q] {
				mods := make(mods.QueryMods[Q], 0, 1)

				{
					mods = append(mods, dialect.Join[Q](typ, Facilities.Name().As(to.Alias())).On(
						to.ID.EQ(from.FacilityID),
					))
				}

				return mods
			},
		}
	}
}

func courtGroupsJoinPricePeriods[Q dialect.Joinable](from courtGroupColumns, typ string) func(context.Context) modAs[Q, pricePeriodColumns] {
	return func(ctx context.Context) modAs[Q, pricePeriodColumns] {
		return modAs[Q, pricePeriodColumns]{
			c: PricePeriodColumns,
			f: func(to pricePeriodColumns) bob.Mod[Q] {
				mods := make(mods.QueryMods[Q], 0, 1)

				{
					mods = append(mods, dialect.Join[Q](typ, PricePeriods.Name().As(to.Alias())).On(
						to.CourtGroupID.EQ(from.ID),
					))
				}

				return mods
			},
		}
	}
}

// Facility starts a query for related objects on facilities
func (o *CourtGroup) Facility(mods ...bob.Mod[*dialect.SelectQuery]) FacilitiesQuery {
	return Facilities.Query(append(mods,
		sm.Where(FacilityColumns.ID.EQ(mysql.Arg(o.FacilityID))),
	)...)
}

func (os CourtGroupSlice) Facility(mods ...bob.Mod[*dialect.SelectQuery]) FacilitiesQuery {
	PKArgs := make([]bob.Expression, len(os))
	for i, o := range os {
		PKArgs[i] = mysql.ArgGroup(o.FacilityID)
	}

	return Facilities.Query(append(mods,
		sm.Where(mysql.Group(FacilityColumns.ID).In(PKArgs...)),
	)...)
}

// PricePeriods starts a query for related objects on price_periods
func (o *CourtGroup) PricePeriods(mods ...bob.Mod[*dialect.SelectQuery]) PricePeriodsQuery {
	return PricePeriods.Query(append(mods,
		sm.Where(PricePeriodColumns.CourtGroupID.EQ(mysql.Arg(o.ID))),
	)...)
}

func (os CourtGroupSlice) PricePeriods(mods ...bob.Mod[*dialect.SelectQuery]) PricePeriodsQuery {
	PKArgs := make([]bob.Expression, len(os))
	for i, o := range os {
		PKArgs[i] = mysql.ArgGroup(o.ID)
	}

	return PricePeriods.Query(append(mods,
		sm.Where(mysql.Group(PricePeriodColumns.CourtGroupID).In(PKArgs...)),
	)...)
}

func (o *CourtGroup) Preload(name string, retrieved any) error {
	if o == nil {
		return nil
	}

	switch name {
	case "Facility":
		rel, ok := retrieved.(*Facility)
		if !ok {
			return fmt.Errorf("courtGroup cannot load %T as %q", retrieved, name)
		}

		o.R.Facility = rel

		if rel != nil {
			rel.R.CourtGroups = CourtGroupSlice{o}
		}
		return nil
	case "PricePeriods":
		rels, ok := retrieved.(PricePeriodSlice)
		if !ok {
			return fmt.Errorf("courtGroup cannot load %T as %q", retrieved, name)
		}

		o.R.PricePeriods = rels

		for _, rel := range rels {
			if rel != nil {
				rel.R.CourtGroup = o
			}
		}
		return nil
	default:
		return fmt.Errorf("courtGroup has no relationship %q", name)
	}
}

func PreloadCourtGroupFacility(opts ...mysql.PreloadOption) mysql.Preloader {
	return mysql.Preload[*Facility, FacilitySlice](orm.Relationship{
		Name: "Facility",
		Sides: []orm.RelSide{
			{
				From: TableNames.CourtGroups,
				To:   TableNames.Facilities,
				FromColumns: []string{
					ColumnNames.CourtGroups.FacilityID,
				},
				ToColumns: []string{
					ColumnNames.Facilities.ID,
				},
			},
		},
	}, Facilities.Columns().Names(), opts...)
}

func ThenLoadCourtGroupFacility(queryMods ...bob.Mod[*dialect.SelectQuery]) mysql.Loader {
	return mysql.Loader(func(ctx context.Context, exec bob.Executor, retrieved any) error {
		loader, isLoader := retrieved.(interface {
			LoadCourtGroupFacility(context.Context, bob.Executor, ...bob.Mod[*dialect.SelectQuery]) error
		})
		if !isLoader {
			return fmt.Errorf("object %T cannot load CourtGroupFacility", retrieved)
		}

		err := loader.LoadCourtGroupFacility(ctx, exec, queryMods...)

		// Don't cause an issue due to missing relationships
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}

		return err
	})
}

// LoadCourtGroupFacility loads the courtGroup's Facility into the .R struct
func (o *CourtGroup) LoadCourtGroupFacility(ctx context.Context, exec bob.Executor, mods ...bob.Mod[*dialect.SelectQuery]) error {
	if o == nil {
		return nil
	}

	// Reset the relationship
	o.R.Facility = nil

	related, err := o.Facility(mods...).One(ctx, exec)
	if err != nil {
		return err
	}

	related.R.CourtGroups = CourtGroupSlice{o}

	o.R.Facility = related
	return nil
}

// LoadCourtGroupFacility loads the courtGroup's Facility into the .R struct
func (os CourtGroupSlice) LoadCourtGroupFacility(ctx context.Context, exec bob.Executor, mods ...bob.Mod[*dialect.SelectQuery]) error {
	if len(os) == 0 {
		return nil
	}

	facilities, err := os.Facility(mods...).All(ctx, exec)
	if err != nil {
		return err
	}

	for _, o := range os {
		for _, rel := range facilities {
			if o.FacilityID != rel.ID {
				continue
			}

			rel.R.CourtGroups = append(rel.R.CourtGroups, o)

			o.R.Facility = rel
			break
		}
	}

	return nil
}

func ThenLoadCourtGroupPricePeriods(queryMods ...bob.Mod[*dialect.SelectQuery]) mysql.Loader {
	return mysql.Loader(func(ctx context.Context, exec bob.Executor, retrieved any) error {
		loader, isLoader := retrieved.(interface {
			LoadCourtGroupPricePeriods(context.Context, bob.Executor, ...bob.Mod[*dialect.SelectQuery]) error
		})
		if !isLoader {
			return fmt.Errorf("object %T cannot load CourtGroupPricePeriods", retrieved)
		}

		err := loader.LoadCourtGroupPricePeriods(ctx, exec, queryMods...)

		// Don't cause an issue due to missing relationships
		if errors.Is(err, sql.ErrNoRows) {
			return nil
		}

		return err
	})
}

// LoadCourtGroupPricePeriods loads the courtGroup's PricePeriods into the .R struct
func (o *CourtGroup) LoadCourtGroupPricePeriods(ctx context.Context, exec bob.Executor, mods ...bob.Mod[*dialect.SelectQuery]) error {
	if o == nil {
		return nil
	}

	// Reset the relationship
	o.R.PricePeriods = nil

	related, err := o.PricePeriods(mods...).All(ctx, exec)
	if err != nil {
		return err
	}

	for _, rel := range related {
		rel.R.CourtGroup = o
	}

	o.R.PricePeriods = related
	return nil
}

// LoadCourtGroupPricePeriods loads the courtGroup's PricePeriods into the .R struct
func (os CourtGroupSlice) LoadCourtGroupPricePeriods(ctx context.Context, exec bob.Executor, mods ...bob.Mod[*dialect.SelectQuery]) error {
	if len(os) == 0 {
		return nil
	}

	pricePeriods, err := os.PricePeriods(mods...).All(ctx, exec)
	if err != nil {
		return err
	}

	for _, o := range os {
		o.R.PricePeriods = nil
	}

	for _, o := range os {
		for _, rel := range pricePeriods {
			if o.ID != rel.CourtGroupID {
				continue
			}

			rel.R.CourtGroup = o

			o.R.PricePeriods = append(o.R.PricePeriods, rel)
		}
	}

	return nil
}

func attachCourtGroupFacility0(ctx context.Context, exec bob.Executor, count int, courtGroup0 *CourtGroup, facility1 *Facility) (*CourtGroup, error) {
	setter := &CourtGroupSetter{
		FacilityID: omit.From(facility1.ID),
	}

	err := courtGroup0.Update(ctx, exec, setter)
	if err != nil {
		return nil, fmt.Errorf("attachCourtGroupFacility0: %w", err)
	}

	return courtGroup0, nil
}

func (courtGroup0 *CourtGroup) InsertFacility(ctx context.Context, exec bob.Executor, related *FacilitySetter) error {
	facility1, err := Facilities.Insert(related).One(ctx, exec)
	if err != nil {
		return fmt.Errorf("inserting related objects: %w", err)
	}

	_, err = attachCourtGroupFacility0(ctx, exec, 1, courtGroup0, facility1)
	if err != nil {
		return err
	}

	courtGroup0.R.Facility = facility1

	facility1.R.CourtGroups = append(facility1.R.CourtGroups, courtGroup0)

	return nil
}

func (courtGroup0 *CourtGroup) AttachFacility(ctx context.Context, exec bob.Executor, facility1 *Facility) error {
	var err error

	_, err = attachCourtGroupFacility0(ctx, exec, 1, courtGroup0, facility1)
	if err != nil {
		return err
	}

	courtGroup0.R.Facility = facility1

	facility1.R.CourtGroups = append(facility1.R.CourtGroups, courtGroup0)

	return nil
}

func insertCourtGroupPricePeriods0(ctx context.Context, exec bob.Executor, pricePeriods1 []*PricePeriodSetter, courtGroup0 *CourtGroup) (PricePeriodSlice, error) {
	for i := range pricePeriods1 {
		pricePeriods1[i].CourtGroupID = omit.From(courtGroup0.ID)
	}

	ret, err := PricePeriods.Insert(bob.ToMods(pricePeriods1...)).All(ctx, exec)
	if err != nil {
		return ret, fmt.Errorf("insertCourtGroupPricePeriods0: %w", err)
	}

	return ret, nil
}

func attachCourtGroupPricePeriods0(ctx context.Context, exec bob.Executor, count int, pricePeriods1 PricePeriodSlice, courtGroup0 *CourtGroup) (PricePeriodSlice, error) {
	setter := &PricePeriodSetter{
		CourtGroupID: omit.From(courtGroup0.ID),
	}

	err := pricePeriods1.UpdateAll(ctx, exec, *setter)
	if err != nil {
		return nil, fmt.Errorf("attachCourtGroupPricePeriods0: %w", err)
	}

	return pricePeriods1, nil
}

func (courtGroup0 *CourtGroup) InsertPricePeriods(ctx context.Context, exec bob.Executor, related ...*PricePeriodSetter) error {
	if len(related) == 0 {
		return nil
	}

	var err error

	pricePeriods1, err := insertCourtGroupPricePeriods0(ctx, exec, related, courtGroup0)
	if err != nil {
		return err
	}

	courtGroup0.R.PricePeriods = append(courtGroup0.R.PricePeriods, pricePeriods1...)

	for _, rel := range pricePeriods1 {
		rel.R.CourtGroup = courtGroup0
	}
	return nil
}

func (courtGroup0 *CourtGroup) AttachPricePeriods(ctx context.Context, exec bob.Executor, related ...*PricePeriod) error {
	if len(related) == 0 {
		return nil
	}

	var err error
	pricePeriods1 := PricePeriodSlice(related)

	_, err = attachCourtGroupPricePeriods0(ctx, exec, len(related), pricePeriods1, courtGroup0)
	if err != nil {
		return err
	}

	courtGroup0.R.PricePeriods = append(courtGroup0.R.PricePeriods, pricePeriods1...)

	for _, rel := range related {
		rel.R.CourtGroup = courtGroup0
	}

	return nil
}
